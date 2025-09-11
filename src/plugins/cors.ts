import type { FastifyPluginAsync } from "fastify"
import fastifyCors from "@fastify/cors"
import fastifyPlugin from "fastify-plugin"

const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyCors, {
    origin: fastify.env.ALLOW_ORIGINS,
    allowedHeaders: fastify.env.ALLOW_HEADERS,
    methods: fastify.env.ALLOW_METHODS,
    credentials: fastify.env.ALLOW_CREDENTIALS,
  })
}

export default fastifyPlugin(corsPlugin, {
  name: "cors",
  dependencies: ["env"],
})
