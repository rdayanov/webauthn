import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/server'
import fp from 'fastify-plugin'

const rpName = 'WebAuthn Lab'
const rpID = `localhost`
const origin = `http://localhost:${ process.env.PORT }`

declare module 'fastify' {
  interface FastifyInstance {
    webauthn: {
      rpName: string;
      rpID: string;
      origin: string;
    };
  }
}

declare module '@fastify/session' {
  interface FastifySessionObject {
    webauthnChallenge?: PublicKeyCredentialCreationOptionsJSON;
  }
}

export default fp(async function (fastify) {
  fastify.decorate('webauthn', {
    rpName,
    rpID,
    origin,
  })
})
