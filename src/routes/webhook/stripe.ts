import { FastifyInstance } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"

export default async function checkout(fastify: FastifyInstance) {
  if (!fastify.stripeWebhookSecret)
    throw new Error("Stripe webhook secret not found")

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/stripe",
    config: {
      rawBody: true,
    },
    preHandler: [fastify.verifyStripeSignature],
    handler: async (request, reply) => {
      const event = request.event

      switch (event.type) {
        case "checkout.session.completed":
          console.log("Event received checkout.session.completed:", event)
          fastify.log.info(event)
          break

        case "checkout.session.expired":
          console.log("Event received checkout.session.expired:", event)
          fastify.log.info(event)
          break

        case "invoice.paid":
          console.log("Event received invoice.paid:", event)
          fastify.log.info(event)
          break

        case "invoice.payment_failed":
          console.log("Event received invoice.payment_failed:", event)
          fastify.log.info(event)
          break

        case "invoice.marked_uncollectible":
          console.log("Event received invoice.marked_uncollectible:", event)
          fastify.log.info(event)
          break

        case "invoice.payment_succeeded":
          console.log("Event received invoice.payment_succeeded:", event)
          fastify.log.info(event)
          break

        default:
          fastify.log.info(`Unhandled event type ${event.type}.`)
      }

      return reply.code(200).send({ success: true, message: "Received" })
    },
  })
}
