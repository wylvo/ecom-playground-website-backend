import { StripeHandler } from "@/types/stripe-handler"
import Stripe from "stripe"
import { eq } from "drizzle-orm"
import { carts, orders } from "@/db/schema"

export default async function ({ fastify, event }: StripeHandler) {
  try {
    const session = event.data.object as Stripe.Checkout.Session

    const [order] = await fastify.db
      .update(orders)
      .set({
        status: "cancelled",
        financialStatus: "voided",
        stripePaymentStatus: session.payment_status,
        updatedAt: new Date().toISOString(),
        cancelledAt: new Date().toISOString(),
      })
      .where(eq(orders.stripeCheckoutSessionId, session.id))
      .returning({
        id: orders.id,
        authUserId: orders.authUserId,
        cartHash: orders.cartHash,
      })

    if (!order)
      return fastify.log.error(
        `No order found for Stripe checkout session: ${session.id}`,
      )

    await fastify.db
      .update(carts)
      .set({
        updatedAt: new Date().toISOString(), // Necessary to generate a unique order idempotency key
      })
      .where(eq(carts.authUserId, order.authUserId))
  } catch (error) {
    fastify.log.error(error, "Failed to handle checkout.session.expired event")
    throw error
  }
}
