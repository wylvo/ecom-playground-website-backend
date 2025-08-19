import type { FastifyPluginAsync } from "fastify"
import fastifyHelmet from "@fastify/helmet"
import fastifyPlugin from "fastify-plugin"

const helmetPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyHelmet)
}

export default fastifyPlugin(helmetPlugin, { name: "helmet" })
