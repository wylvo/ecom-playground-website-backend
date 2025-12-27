import { FastifyError, type FastifyPluginAsync } from "fastify"
import fastifyRateLimit from "@fastify/rate-limit"
import fastifyPlugin from "fastify-plugin"

const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  const max = fastify.env.RATE_LIMIT_MAX
  const timeWindow = fastify.env.RATE_LIMIT_TIME_WINDOW
  const allowList = fastify.env.RATE_LIMIT_ALLOW_LIST
  const ban = fastify.env.RATE_LIMIT_BAN

  if (!max || !timeWindow || !allowList || !ban)
    throw new Error("Missing rate limit env vars")

  await fastify.register(fastifyRateLimit, {
    max,
    timeWindow,
    allowList,
    ban,
  })

  fastify.setErrorHandler<FastifyError>(function (error, request, reply) {
    if (error.statusCode === 429) {
      reply.code(429)
      error.message = "Too many requests! Please try again later"
    }
    reply.send(error)
  })

  fastify.setNotFoundHandler(
    {
      preHandler: [fastify.rateLimit()],
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
  name: "rate-limit",
  dependencies: ["env"],
})
