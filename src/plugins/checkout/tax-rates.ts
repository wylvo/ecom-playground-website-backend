import type { FastifyRequest, FastifyReply, FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    verifyCheckoutTaxRates: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>
  }
}

const checkoutTaxRatesPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate(
    "verifyCheckoutTaxRates",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // TODO: Check if tax rates are valid
      } catch (err) {
        fastify.log.error(err)
        return reply.code(500).send({
          success: false,
          error: "Something went wrong verifying tax rates",
        })
      }
    },
  )
}

export default fastifyPlugin(checkoutTaxRatesPlugin, {
  name: "checkout-tax-rates",
})
