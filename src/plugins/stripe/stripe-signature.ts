import type { FastifyRequest, FastifyReply, FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"
import Stripe from "stripe"

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    verifyStripeSignature: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>
  }
  interface FastifyRequest {
    event?: Stripe.Event
  }
}

const stripeSignaturePlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate(
    "verifyStripeSignature",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        let event = request.body as Stripe.Event
        const webhookSecret = fastify.stripeWebhookSecret
        const signature = request.headers["stripe-signature"]

        try {
          event = fastify.stripe.webhooks.constructEvent(
            request.rawBody,
            signature,
            webhookSecret,
          )
        } catch (error) {
          const errorMessage = "Webhook signature verification failed"
          fastify.log.error(error, errorMessage)
          return reply.code(400).send({ success: false, message: errorMessage })
        }

        // Event is valid, attach the event
        request.event = event
      } catch (error) {
        const errorMessage =
          "Something went wrong verifying the Stripe webhook signature"
        fastify.log.error(error, errorMessage)
        return reply.code(500).send({ success: false, message: errorMessage })
      }
    },
  )
}

export default fastifyPlugin(stripeSignaturePlugin, {
  name: "stripe-signature",
  dependencies: ["stripe", "stripe-webhook-ip"],
})
