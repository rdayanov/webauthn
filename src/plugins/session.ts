import fp from 'fastify-plugin'
import cookiePlugin from '@fastify/cookie'
import sessionPlugin from '@fastify/session'

const SESSION_SECRET = process.env.SESSION_SECRET || ''

export default fp(async function (fastify, _opts) {
  fastify.register(cookiePlugin)
  fastify.register(sessionPlugin, { secret: SESSION_SECRET, cookie: { secure: false } })
})
