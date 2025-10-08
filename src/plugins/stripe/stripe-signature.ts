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
        } catch (err) {
          fastify.log.error(err)
          console.error(err)
          return reply.code(400).send({
            success: false,
            message: "Webhook signature verification failed",
          })
        }

        // Event is valid, attach the event
        request.event = event
      } catch (err) {
        request.log.error(err)
        return reply.code(500).send({
          success: false,
          message:
            "Something went wrong verifying the Stripe webhook signature",
        })
      }
    },
  )
}

export default fastifyPlugin(stripeSignaturePlugin, {
  name: "stripe-signature",
  dependencies: ["stripe"],
})
