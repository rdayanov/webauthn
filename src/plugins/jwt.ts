import fp from 'fastify-plugin'
import jwtPlugin, { FastifyJwtNamespace } from '@fastify/jwt'
import { User } from '../generated/prisma/client.js'

const JWT_SECRET = process.env.JWT_SECRET as string

const TOKEN_COOKIE_NAME = 'jwt_token'
const TOKEN_COOKIE_MAX_AGE = 60_000_000_000

const TOKEN_TTL = '30s'

declare module 'fastify' {
  interface FastifyInstance extends FastifyJwtNamespace<{ namespace: 'security' }> {
    jwtToken: {
      createToken(user: User): string;
    }
  }

  interface FastifyReply {
    jwtTokenStoreToken(token: string): void;

    jwtTokenDeleteToken(): void;
  }

  interface FastifyRequest {
    jwtTokenVerifyToken(): Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { user: Omit<User, 'email'> }
    user: Omit<User, 'email'>
  }
}

export default fp((fastify) => {
  fastify.register(jwtPlugin, {
    secret: JWT_SECRET,
    cookie: { cookieName: TOKEN_COOKIE_NAME, signed: false },
  })

  fastify.decorate('jwtToken', {
    createToken({ email, ...user }: User): string {
      return fastify.jwt.sign({ user }, { expiresIn: TOKEN_TTL })
    },
  })

  fastify.decorateReply('jwtTokenStoreToken', function storeToken(token: string): void {
    this.cookie(TOKEN_COOKIE_NAME, token, {
      maxAge: TOKEN_COOKIE_MAX_AGE,
      path: '/',
    })
  })

  fastify.decorateReply('jwtTokenDeleteToken', function deleteToken(): void {
    this.clearCookie(TOKEN_COOKIE_NAME)
  })

  fastify.decorateRequest('jwtTokenVerifyToken', async function tokenVerifyToken(): Promise<void> {
    const token = this.cookies[TOKEN_COOKIE_NAME]
    if (!token) {
      throw fastify.httpErrors.forbidden()
    }

    const decodedToken = await this.jwtDecode<{ exp: number; user: User }>()
    if (Date.now() > decodedToken.exp * 1_000) {
      throw fastify.httpErrors.unauthorized()
    }

    this.user = decodedToken.user
  })
})
