import { stripeWebhookEvents } from "@/db/schema"
import { eq } from "drizzle-orm"
import type { FastifyRequest, FastifyReply, FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"
import postgres from "postgres"
import Stripe from "stripe"

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    insertStripeEvent: (
      event: Stripe.Event,
    ) => Promise<postgres.RowList<never[]>>

    setStripeEventProcessedToTrue: (
      eventId: string,
    ) => Promise<postgres.RowList<never[]>>

    verifyStripeIdempotentEvent: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>
  }

  interface FastifyRequest {
    eventProcessed?: boolean
  }
}

const stripeIdempotentEventPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate("insertStripeEvent", async (event: Stripe.Event) => {
    try {
      return await fastify.db.insert(stripeWebhookEvents).values({
        id: event.id,
        type: event.type,
        data: event.data,
        processed: false,
        receivedAt: new Date().toISOString(),
      })
    } catch (error) {
      fastify.log.error(
        error,
        `Failed to insert Stripe event: ${event.id} into database`,
      )
    }
  })

  fastify.decorate("setStripeEventProcessedToTrue", async (eventId: string) => {
    try {
      return await fastify.db
        .update(stripeWebhookEvents)
        .set({
          processed: true,
        })
        .where(eq(stripeWebhookEvents.id, eventId))
    } catch (error) {
      fastify.log.error(error, `Failed to update Stripe event: ${eventId}`)
    }
  })

  fastify.decorate(
    "verifyStripeIdempotentEvent",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const event = request.event

        const existingEvent =
          await fastify.db.query.stripeWebhookEvents.findFirst({
            where: eq(stripeWebhookEvents.id, event.id),
          })

        // Check if we've already processed this event
        if (existingEvent?.processed) {
          request.eventProcessed = true
          fastify.log.info(`Duplicate webhook event: ${event.id} skipped.`)
          return reply
            .code(200)
            .send({ success: true, message: "Stripe event already processed" })
        }
      } catch (error) {
        const errorMessage =
          "Something went wrong verifying for an idempotent Stripe event"
        fastify.log.error(error, errorMessage)
        return reply.code(500).send({ success: false, message: errorMessage })
      }
    },
  )
}

export default fastifyPlugin(stripeIdempotentEventPlugin, {
  name: "stripe-idempotent-event",
  dependencies: ["database", "stripe", "stripe-signature"],
})
