import { StripeHandler } from "@/types/stripe-handler"
import Stripe from "stripe"
import { eq } from "drizzle-orm"
import { orders } from "@/db/schema"

export default async function ({ fastify, event }: StripeHandler) {
  try {
    const session = event.data.object as Stripe.Checkout.Session

    await fastify.db
      .update(orders)
      .set({
        status: "cancelled",
        financialStatus: "voided",
        updatedAt: new Date().toISOString(),
        cancelledAt: new Date().toISOString(),
      })
      .where(eq(orders.stripeCheckoutSessionId, session.id))
  } catch (error) {
    fastify.log.error(error, "Failed to handle checkout.session.expired event")
    throw error
  }
}
