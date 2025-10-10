import fp from 'fastify-plugin'
import sessionPlugin from '@fastify/session'

const SESSION_SECRET = process.env.SESSION_SECRET as string

export default fp(async function (fastify, _opts) {
  fastify.register(sessionPlugin, { secret: SESSION_SECRET, cookie: { secure: false } })
})
