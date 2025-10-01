import {
  AuthenticatorTransportFuture,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server'
import { FastifyPluginAsync } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { Passkey } from '../../../generated/prisma/client.js'

const authStartSchema = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
    },
    challenge: {
      type: 'string',
    },
  },
  additionalProperties: false,
} as const
type AuthStartBody = FromSchema<typeof authStartSchema>

const authVerificationSchema = {
  type: 'object',
  properties: {
    response: {
      type: 'object',
    },
  },
  additionalProperties: false,
  required: ['response'],
} as const
type AuthVerificationBody = FromSchema<typeof authVerificationSchema> & { response: AuthenticationResponseJSON }

const loginRoutes: FastifyPluginAsync = async (fastify, opts) => {
  const { prisma, webauthn } = fastify

  fastify.get('/', async (request, reply) => {
    return reply.sendFile('login.html')
  })

  fastify.post<{ Body: AuthStartBody }>('/start', { schema: { body: authStartSchema } }, async (request, reply) => {
    const user = request.body.username && await prisma.user.findUnique({ where: { username: request.body.username } })
    let userPasskeys: Passkey[] = []
    if (user) {
      userPasskeys = await prisma.passkey.findMany({ where: { user } })
    }

    const challenge = await generateAuthenticationOptions({
      rpID: webauthn.RP.rpID,
      allowCredentials: userPasskeys.map(({ id, transports }) => ({
        id,
        transports: transports ? transports.split(',') as AuthenticatorTransportFuture[] : undefined,
      })),
      challenge: request.body.challenge,
    })

    webauthn.storeChallenge(challenge, request)

    return challenge
  })

  fastify.post<{
    Body: AuthVerificationBody
  }>('/verify', { schema: { body: authVerificationSchema } }, async (request, reply) => {
    const challenge = webauthn.getRequestChallenge(request)
    if (!challenge) {
      reply.status(404)
      throw new Error('No challenge found for the auth request.')
    }

    const response = request.body.response
    const passkey = await prisma.passkey.findUnique({ where: { id: response.id } })
    if (!passkey) {
      throw new Error(`Could not find passkey ${ response.id }`)
    }

    let verification
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: webauthn.RP.origin,
        expectedRPID: webauthn.RP.rpID,
        credential: {
          id: passkey.id,
          publicKey: passkey.publicKey as Uint8Array<ArrayBuffer>,
          counter: passkey.counter,
          transports: passkey.transports ? passkey.transports.split(',') as AuthenticatorTransportFuture[] : [],
        },
      })
    } catch (error) {
      console.error(error)
      reply.status(400)
      return { error }
    }

    const { verified } = verification

    if (verified) {
      const { authenticationInfo: { newCounter } } = verification
      await prisma.passkey.update({ data: { counter: newCounter }, where: { id: passkey.id } })
      const user = await prisma.user.findUnique({ where: { id: passkey.userId } })
      console.log('user: ', user)
    }

    return { verified }
  })
}

export default loginRoutes
