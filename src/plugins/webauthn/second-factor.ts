import {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  generateAuthenticationOptions, verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import { FastifyRequest } from 'fastify'
import createError from '@fastify/error'

export type UserVerification = 'required' | 'preferred' | 'discouraged';

const CHALLENGE_RESPONSE_HEADER_NAME = 'x-2fa-challenge-response'

const SecondFactorRequiredError = createError('FST_WEBAUTHN_CHALLENGE', '%s', 428)
const SecondFactorVerificationFailedError = createError('FST_WEBAUTHN_CHALLENGE_VERIFICATION_FAILED', 'Second Factor challenge verification failed.', 403)

export async function secondFactor(this: FastifyRequest, userVerification: UserVerification = 'preferred'): Promise<void> {
  const prisma = this.server.prisma
  const webauthn = this.server.webauthn

  if (!this.headers[CHALLENGE_RESPONSE_HEADER_NAME]) {
    return throwChallenge(this)
  }

  const response = JSON.parse(atob(this.headers[CHALLENGE_RESPONSE_HEADER_NAME] as string)) as AuthenticationResponseJSON
  const passkey = await prisma.passkey.findUnique({ where: { id: response.id } })
  const storedChallenge = webauthn.getRequestChallenge(this)

  if (!passkey || !storedChallenge || this.url !== storedChallenge?.url) {
    return throwChallenge(this)
  }

  try {
    const { verified } = await verifyAuthenticationResponse({
      response,
      expectedChallenge: storedChallenge.challenge.challenge,
      expectedOrigin: webauthn.RP.origin,
      expectedRPID: webauthn.RP.rpID,
      credential: {
        id: passkey.id,
        publicKey: passkey.publicKey as Uint8Array<ArrayBuffer>,
        counter: passkey.counter,
        transports: passkey.transports ? passkey.transports.split(',') as AuthenticatorTransportFuture[] : [],
      },
      requireUserVerification: userVerification !== 'discouraged',
    })
    if (!verified) {
      throw new Error('Verification failed.')
    }
  } catch (e) {
    throw new SecondFactorVerificationFailedError('', { cause: e })
  }


  async function throwChallenge(request: FastifyRequest): Promise<never> {
    const userPasskeys = await prisma.user.findUniqueOrThrow({ where: { id: request.user.id } })
      .then((user) => prisma.passkey.findMany({ where: { user } }))

    const challenge = await generateAuthenticationOptions({
      rpID: webauthn.RP.rpID,
      allowCredentials: userPasskeys.map(({ id, transports }) => ({
        id,
        transports: transports ? transports.split(',') as AuthenticatorTransportFuture[] : undefined,
      })),
      userVerification,
    })

    webauthn.storeChallenge(challenge, request)

    throw new SecondFactorRequiredError(JSON.stringify({ challenge }))
  }
}
