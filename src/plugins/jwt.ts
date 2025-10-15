import fp from 'fastify-plugin'
import jwtPlugin from '@fastify/jwt'
import { User } from '../generated/prisma/client.js'

const JWT_SECRET = process.env.JWT_SECRET as string

const TOKEN_COOKIE_NAME = 'token'
const TOKEN_COOKIE_MAX_AGE = 60_000

const TOKEN_TTL = '30s'

declare module 'fastify' {
  interface FastifyInstance {
    jwtToken: {
      createToken(user: Partial<User>): string;
    }
  }

  interface FastifyReply {
    jwtTokenStoreToken(token: string): void;

    jwtTokenDeleteToken(): void;
  }
}

export default fp((fastify) => {
  fastify.register(jwtPlugin, { secret: JWT_SECRET })

  fastify.decorate('jwtToken', {
    createToken(user: Partial<User>): string {
      return fastify.jwt.sign({ user }, { expiresIn: TOKEN_TTL })
    },
  })

  fastify.decorateReply('jwtTokenStoreToken', function storeToken(token: string): void {
    this.cookie(TOKEN_COOKIE_NAME, token, { maxAge: TOKEN_COOKIE_MAX_AGE })
  })

  fastify.decorateReply('jwtTokenDeleteToken', function deleteToken(): void {
    this.clearCookie(TOKEN_COOKIE_NAME)
  })
})
