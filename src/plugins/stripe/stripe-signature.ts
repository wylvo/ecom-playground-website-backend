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

interface StripeWebhookBody {
  raw: Buffer
}

const stripeSignaturePlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate(
    "verifyStripeSignature",
    async (
      request: FastifyRequest<{ Body: StripeWebhookBody }>,
      reply: FastifyReply,
    ) => {
      try {
        let event: Stripe.Event
        const webhookSecret = fastify.stripeWebhookSecret
        const signature = request.headers["stripe-signature"]

        try {
          event = fastify.stripe.webhooks.constructEvent(
            request.body.raw,
            signature,
            webhookSecret,
          )
        } catch (error) {
          const errorMessage = "Webhook signature verification failed"
          fastify.log.error(error, errorMessage)
          return reply.code(400).send({ success: false, message: errorMessage })
        }

        fastify.log.info("Stripe header signature verified successfully!")

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
