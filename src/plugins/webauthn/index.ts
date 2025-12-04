import fp from 'fastify-plugin'
import {
  ChallengeStoreHelpers,
  getRegistrationChallenge,
  getRequestChallenge,
  storeChallenge, StoredChallenge,
} from './challenge-store.js'

import { secondFactor, UserVerification } from './second-factor.js'

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
    } & ChallengeStoreHelpers;
  }

  interface FastifyRequest {
    webauthn2fa(userVerification?: UserVerification): Promise<void>;
  }
}

declare module '@fastify/session' {
  interface FastifySessionObject {
    webauthnChallenge?: StoredChallenge;
  }
}

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

  fastify.decorateRequest('webauthn2fa', secondFactor)

})
