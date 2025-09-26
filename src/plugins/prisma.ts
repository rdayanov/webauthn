import fp from 'fastify-plugin'
import { PrismaClient } from '../generated/prisma/client.js'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}

const prismaPlugin = fp(async (fastify, opts) => {
  const prisma = new PrismaClient()
  await prisma.$connect()
  fastify.decorate('prisma', prisma)
  fastify.addHook('onClose', async () => {
    await prisma.$disconnect()
  })
})

export default prismaPlugin
