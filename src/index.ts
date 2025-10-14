import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

import autoLoad from "@fastify/autoload"
import {
  validatorCompiler,
  serializerCompiler,
} from "fastify-type-provider-zod"
import Fastify from "fastify"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const fastify = Fastify({
  logger: true,
  trustProxy: "127.0.0.1",
})

fastify.setValidatorCompiler(validatorCompiler)
fastify.setSerializerCompiler(serializerCompiler)

// Load all plugins
await fastify.register(autoLoad, {
  dir: join(__dirname, "plugins"),
})

// Load all routes
await fastify.register(autoLoad, {
  dir: join(__dirname, "routes"),
})

/**
 * Run the server!
 */
const start = async () => {
  try {
    await fastify.listen({ host: fastify.env.HOST, port: fastify.env.PORT })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()
