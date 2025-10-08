import handleChargeRefunded from "@/handlers/stripe/handleChargeRefunded"
import handleCheckoutSessionCompleted from "@/handlers/stripe/handleCheckoutSessionCompleted"
import handleCheckoutSessionExpired from "@/handlers/stripe/handleCheckoutSessionExpired"
import { FastifyInstance } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import Stripe from "stripe"

export default async function stripe(fastify: FastifyInstance) {
  if (!fastify.stripeWebhookSecret)
    throw new Error("Stripe webhook secret not found")

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/stripe",
    config: {
      rawBody: true,
    },
    preHandler: [
      /*fastify.verifyStripeSignature,*/
      fastify.verifyStripeIdempotentEvent,
    ],
    handler: async (request, reply) => {
      if (request?.eventProcessed) return

      const event = request.body as Stripe.Event
      let isHandled = true

      try {
        // Log the event in the database
        await fastify.insertStripeEvent(event)

        // Send 200 OK to Stripe ASAP
        reply.code(200).send({ success: true, message: "Received" })
      } catch (error) {
        fastify.log.error(
          error,
          "Something went wrong while logging a Stripe event",
        )
        return reply.code(500).send({
          success: false,
          message: "Something went wrong while logging a Stripe event",
        })
      }

      try {
        // Handle the event
        switch (event.type) {
          case "checkout.session.completed":
            console.log("checkout.session.completed:", event.data.object)
            void handleCheckoutSessionCompleted({ fastify, event })
            break

          case "checkout.session.expired":
            console.log("checkout.session.expired:", event.data.object)
            void handleCheckoutSessionExpired({ fastify, event })
            break

          case "charge.refunded":
            console.log("charge.refunded:", event.data.object)
            void handleChargeRefunded({ fastify, event })
            break

          default:
            fastify.log.info(`Unhandled event type ${event.type}.`)
            isHandled = false
        }

        fastify.log.info(`Resquest IP: ${request.ip}`)

        // Mark the Stripe event as processed in the database
        if (isHandled) void fastify.setStripeEventProcessedToTrue(event.id)
      } catch (err) {
        fastify.log.error(
          err,
          "Something went wrong while handling a Stripe event",
        )
        console.error(err)
      }
    },
  })
}
