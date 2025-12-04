import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/server'
import fp from 'fastify-plugin'
import {
  ChallengeStoreHelpers,
  getRegistrationChallenge,
  getRequestChallenge,
  storeChallenge,
} from './challenge-store.js'

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
}

declare module '@fastify/session' {
  interface FastifySessionObject {
    webauthnChallenge?: PublicKeyCredentialCreationOptionsJSON | PublicKeyCredentialRequestOptionsJSON;
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

})
