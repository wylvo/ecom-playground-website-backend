import type { FastifyPluginAsync } from "fastify"
import fastifyRateLimit from "@fastify/rate-limit"
import fastifyPlugin from "fastify-plugin"

const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyRateLimit, {
    max: 50,
    timeWindow: "3 minutes",
  })

  fastify.setErrorHandler(function (error, request, reply) {
    if (error.statusCode === 429) {
      reply.code(429)
      error.message = "Too many requests! Please try again later."
    }
    reply.send(error)
  })

  fastify.setNotFoundHandler(
    {
      preHandler: fastify.rateLimit(),
    },
    function (request, reply) {
      reply.code(404).send({
        message: "Route GET:/ not found",
        error: "Not Found",
        statusCode: 404,
      })
    },
  )
}

export default fastifyPlugin(rateLimitPlugin, {
  name: "rateLimit",
})
