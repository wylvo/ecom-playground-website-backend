import type { FastifyRequest, FastifyReply, FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    verifyCheckoutShippingAddress: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>
  }
}

const checkoutShippingAddressPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate(
    "verifyCheckoutShippingAddress",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Validate user shipping address with external API (google, canada post)
      } catch (err) {
        fastify.log.error(err)
        return reply.code(500).send({
          success: false,
          message: "Something went wrong verifying your shipping address",
        })
      }
    },
  )
}

export default fastifyPlugin(checkoutShippingAddressPlugin, {
  name: "checkout-shipping-address",
  dependencies: ["database"],
})
