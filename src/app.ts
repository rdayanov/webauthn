import * as path from 'node:path'
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload'
import { FastifyPluginAsync } from 'fastify'
import { fileURLToPath } from 'node:url'
import Static from '@fastify/static'
import { ServerOptions } from 'node:https'
import fs from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export type AppOptions = {
  // Place your custom options for app below here.
} & Partial<AutoloadPluginOptions> & { https?: Partial<ServerOptions> }

// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {
  https: {
    key: fs.readFileSync(path.join(__dirname, '..', 'localhost.key')),
    cert: fs.readFileSync(path.join(__dirname, '..', 'localhost.crt')),
  },
}

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts,
): Promise<void> => {
  // Place here your custom code!
  void fastify.register(Static, {
    root: path.join(__dirname, 'public'),
    prefix: '/',
    constraints: {},
  })

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  // eslint-disable-next-line no-void
  void fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: opts,
    forceESM: true,
  })

  // This loads all plugins defined in routes
  // define your routes in one of these
  // eslint-disable-next-line no-void
  void fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: opts,
    forceESM: true,
  })
}

export default app
export { app, options }
