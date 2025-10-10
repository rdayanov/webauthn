import fp from 'fastify-plugin'
import jwtPlugin from '@fastify/jwt'

const JWT_SECRET = process.env.JWT_SECRET as string

export default fp((fastify) => {
  fastify.register(jwtPlugin, { secret: JWT_SECRET })
})
