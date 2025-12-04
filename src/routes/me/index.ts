import { FastifyPluginAsync } from 'fastify'

const userRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.addHook('onRequest', async (request, reply) => {
    await request.jwtTokenVerifyToken()
  })

  fastify.get('/', async function (request, reply) {
    return request.user
  })

  fastify.get('/email', async function (request, reply) {
    await request.webauthn2fa()

    const { email } = await fastify.prisma.user.findUniqueOrThrow({ where: { id: request.user.id } })
    return { email }
  })

}

export default userRoutes
