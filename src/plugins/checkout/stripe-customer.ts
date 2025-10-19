import type { FastifyRequest, FastifyReply, FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    verifyCheckoutStripeCustomer: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>
  }
  interface FastifyRequest {
    stripeCustomerId?: string
    shouldCreateStripeCustomer?: boolean
  }
}

const checkoutStripeCustomerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate(
    "verifyCheckoutStripeCustomer",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { is_anonymous: isAnonymous } = request.user
        const customer = request.customer

        // Registered user with existing Stripe customer id
        if (!isAnonymous && customer && customer?.stripeCustomerId) {
          request.stripeCustomerId = customer.stripeCustomerId
          request.shouldCreateStripeCustomer = false
          return
        }

        // Anonymous user or no stripeCustomerId found
        request.shouldCreateStripeCustomer = true
        return
      } catch (err) {
        fastify.log.error(err)
        return reply.code(500).send({
          success: false,
          message: "Something went wrong verifying the Stripe customer",
        })
      }
    },
  )
}

export default fastifyPlugin(checkoutStripeCustomerPlugin, {
  name: "checkout-stripe-customer",
  dependencies: ["auth", "checkout-customer"],
})
