import {
  AuthenticatorTransportFuture,
  generateRegistrationOptions,
  verifyRegistrationResponse,
  RegistrationResponseJSON,
} from '@simplewebauthn/server'

import { FastifyPluginAsync } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import type { Passkey, User } from '../../../generated/prisma/client.ts'

const registrationSchema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
    },
    username: {
      type: 'string',
    },
    displayName: {
      type: 'string',
    },
  },
  required: ['username', 'email', 'displayName'],
  additionalProperties: false,
} as const

type RegistrationBody = FromSchema<typeof registrationSchema>

const verifyRegistrationSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    rawId: { type: 'string' },
    response: { type: 'object' },
    clientExtensionResults: { type: 'object' },
    type: { type: 'string', enum: ['public-key'] },
    authenticatorAttachment: { type: 'string', enum: ['cross-platform', 'platform'] },
  },
  required: ['id', 'rawId', 'response', 'type', 'clientExtensionResults'],
  additionalProperties: false,
} as const
type VerifyRegistrationBody = FromSchema<typeof verifyRegistrationSchema> & RegistrationResponseJSON

const authRoutes: FastifyPluginAsync = async (fastify, opts) => {
  const { prisma } = fastify

  fastify.get('/', async (request, reply) => {
    return reply.sendFile('registration.html')
  })

  fastify.post<{ Body: RegistrationBody }>('/start', {
    schema: {
      body: registrationSchema,
    },
  }, async function (request, reply) {
    const { username, email, displayName } = request.body
    const user: User = await prisma.user.findFirst({ where: { username } })
      || await prisma.user.create({ data: { email, username, displayName } })
    const userPasskeys: Passkey[] = await prisma.passkey.findMany({ where: { user } })

    const options = await generateRegistrationOptions({
      rpName: fastify.webauthn.rpName,
      rpID: fastify.webauthn.rpID,
      userName: user.username,
      userDisplayName: user.displayName,
      attestationType: 'none',
      excludeCredentials: userPasskeys.map(({ id, transports }) => ({
        id,
        transports: transports ? transports.split(',') as AuthenticatorTransportFuture[] : undefined,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
    })

    request.session.webauthnChallenge = options

    return options
  })

  fastify.post<{ Body: VerifyRegistrationBody }>('/verify', {
    schema: {
      body: verifyRegistrationSchema,
    },
  }, async (request, reply) => {
    if (request.session.webauthnChallenge) {
      const challenge = request.session.webauthnChallenge
      const user = await prisma.user.findUnique({ where: { username: challenge.user.name } })

      if (!user) {
        reply.status(404)
        throw new Error('No user found.')
      }

      let verification
      try {
        verification = await verifyRegistrationResponse({
          response: request.body,
          expectedChallenge: challenge.challenge,
          expectedRPID: fastify.webauthn.rpID,
          expectedOrigin: fastify.webauthn.origin,
        })
      } catch (error) {
        console.error(error)
        reply.status(400)
        return { error }
      }

      const { verified, registrationInfo } = verification
      if (verified) {
        const { credential, credentialDeviceType, credentialBackedUp } = registrationInfo

        const newPasskey: Passkey = {
          ...credential,
          webauthnUserID: challenge.user.id,
          userId: user.id,
          deviceType: credentialDeviceType,
          backedUp: credentialBackedUp,
          counter: credential.counter,
          transports: credential.transports ? credential.transports.join(',') : null,
        }

        await prisma.passkey.create({ data: newPasskey })
      }

      return { verified }

    } else {
      reply.status(404)
      throw new Error('No active registration found')
    }
  })
}

export default authRoutes