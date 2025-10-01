import fp from 'fastify-plugin'
import corsPlugin from '@fastify/cors'

export default fp((fastify) => {
  fastify.register(corsPlugin, { origin: '*' })
})
