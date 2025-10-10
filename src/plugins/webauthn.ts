import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/server'
import { FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'

const rpName = 'WebAuthn Lab'
const rpID = `localhost`
const origin = `https://localhost:${ process.env.PORT }`

declare module 'fastify' {
  interface FastifyInstance {
    webauthn: {
      RP: {
        rpName: string;
        rpID: string;
        origin: string;
      };
      storeChallenge(
        challenge: Challenge,
        request: FastifyRequest,
      ): void;
      getRegistrationChallenge(request: FastifyRequest): PublicKeyCredentialCreationOptionsJSON | null;
      getRequestChallenge(request: FastifyRequest): PublicKeyCredentialRequestOptionsJSON | null;
    };
  }
}

declare module '@fastify/session' {
  interface FastifySessionObject {
    webauthnChallenge?: PublicKeyCredentialCreationOptionsJSON | PublicKeyCredentialRequestOptionsJSON;
  }
}

type Challenge = PublicKeyCredentialCreationOptionsJSON | PublicKeyCredentialRequestOptionsJSON

export default fp(async function (fastify) {
  fastify.decorate('webauthn', {
    RP: {
      rpName,
      rpID,
      origin,
    },
    storeChallenge,
    getRegistrationChallenge,
    getRequestChallenge,
  })

  function storeChallenge(
    challenge: Challenge,
    request: FastifyRequest,
  ): void {
    request.session.webauthnChallenge = challenge
  }

  function getRegistrationChallenge(request: FastifyRequest): PublicKeyCredentialCreationOptionsJSON | null {
    const challenge = request.session.webauthnChallenge
    if (isRegistrationChallenge(challenge)) {
      return challenge
    }
    return null
  }

  function getRequestChallenge(request: FastifyRequest): PublicKeyCredentialRequestOptionsJSON | null {
    const challenge = request.session.webauthnChallenge
    if (isRequestChallenge(challenge)) {
      return challenge
    }
    return null
  }

  function isRegistrationChallenge(challenge?: Challenge | null): challenge is PublicKeyCredentialCreationOptionsJSON {
    return !!(
      challenge
      && typeof challenge === 'object'
      && 'rp' in challenge
      && 'user' in challenge
      && 'challenge' in challenge
      && 'pubKeyCredParams' in challenge
    )
  }

  function isRequestChallenge(challenge?: Challenge | null): challenge is PublicKeyCredentialRequestOptionsJSON {
    return !!(
      challenge
      && typeof challenge === 'object'
      && 'challenge' in challenge
      && !('rp' in challenge
        || 'user' in challenge
        || 'pubKeyCredParams' in challenge
      )
    )
  }
})
