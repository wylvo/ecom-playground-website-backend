import type { FastifyPluginAsync } from "fastify"
import fastifyCors from "@fastify/cors"
import fastifyPlugin from "fastify-plugin"

const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyCors, {
    origin: fastify.env.ALLOWED_ORIGINS,
    allowedHeaders: ["Content-Type", "Authorization", "Set-Cookie"],
    methods: ["GET", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
}

export default fastifyPlugin(corsPlugin, {
  name: "cors",
  dependencies: ["env"],
})
