import { StripeHandler } from "@/types/stripe-handler"
import Stripe from "stripe"
import { eq } from "drizzle-orm"
import { payments } from "@/db/schema"

export default async function ({ fastify, event }: StripeHandler) {
  try {
    const charge = event.data.object as Stripe.Charge

    // Find the related payment (if it was inserted already)
    const payment = await fastify.db.query.payments.findFirst({
      where: eq(payments.transactionId, charge.id),
    })

    if (payment) {
      await fastify.db
        .update(payments)
        .set({
          status: "failed",
          providerResponseCode: charge.failure_code ?? null,
          failureReason: charge.failure_message ?? null,
        })
        .where(eq(payments.id, payment.id))
    }

    fastify.log.warn(
      `Stripe charge: ${charge.id} failed. ${charge.failure_message}`,
    )
  } catch (error) {
    fastify.log.error(error, "Failed to handle charge.failed event")
    throw error
  }
}
