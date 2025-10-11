import fp from 'fastify-plugin'
import cookiePlugin from '@fastify/cookie'

export default fp((fastify) => {
  fastify.register(cookiePlugin, {
    parseOptions: { secure: true, httpOnly: true, sameSite: true },
  })
})
