import { FastifyInstance } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import Stripe from "stripe"
import z from "zod"

const allowedEvents: Stripe.Event.Type[] = [
  "checkout.session.completed",
  "checkout.session.expired",
  // "customer.subscription.created",
  // "customer.subscription.updated",
  // "customer.subscription.deleted",
  // "customer.subscription.paused",
  // "customer.subscription.resumed",
  // "customer.subscription.pending_update_applied",
  // "customer.subscription.pending_update_expired",
  // "customer.subscription.trial_will_end",
  "invoice.paid",
  "invoice.payment_failed",
  // "invoice.payment_action_required",
  // "invoice.upcoming",
  "invoice.marked_uncollectible",
  "invoice.payment_succeeded",
  // "payment_intent.succeeded",
  // "payment_intent.payment_failed",
  // "payment_intent.canceled",
]

export default async function checkout(fastify: FastifyInstance) {
  if (!fastify.stripeWebhookSecret)
    throw new Error("Stripe webhook secret not found")

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/stripe",
    handler: async (request, reply) => {
      let event = request.body as Stripe.Event
      const webhookSecret = fastify.stripeWebhookSecret
      const signature = request.headers["stripe-signature"]

      try {
        event = fastify.stripe.webhooks.constructEvent(
          JSON.stringify(request.body),
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

      return reply.code(200).send()
    },
  })
}
