import { StripeHandler } from "@/types/stripe-handler"
import Stripe from "stripe"
import { and, eq } from "drizzle-orm"
import { orders, payments, refunds } from "@/db/schema"

export default async function ({ fastify, event }: StripeHandler) {
  try {
    const originalCharge = event.data.object as Stripe.Charge

    const charge = await fastify.stripe.charges.retrieve(originalCharge.id, {
      expand: ["refunds"],
    })

    const amountRefunded = charge.amount_refunded
    const isPositiveRefundTotal = amountRefunded > 0

    if (!isPositiveRefundTotal)
      return fastify.log.error(
        `Amount refunded of Stripe charge: ${charge.id} is invalid `,
      )

    // Find the payment
    const payment = await fastify.db.query.payments.findFirst({
      where: eq(payments.transactionId, charge.id),
    })

    if (!payment)
      return fastify.log.error(
        `No payment found for Stripe charge: ${charge.id}`,
      )

    const isFullyRefunded = amountRefunded === payment.amount

    // Update payment refunded amount
    await fastify.db
      .update(payments)
      .set({
        amountRefunded: amountRefunded,
        status: isFullyRefunded ? "refunded" : "partially_refunded",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(payments.id, payment.id))

    // Update order refunded total
    await fastify.db
      .update(orders)
      .set({
        ...(isFullyRefunded ? { status: "refunded" } : undefined),
        financialStatus: isFullyRefunded ? "refunded" : "partially_refunded",
        amountRefunded,
        updatedAt: new Date().toISOString(),
        refundedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, payment.orderId))

    if (!charge.refunds?.data || charge.refunds.data.length === 0)
      return fastify.log.error(
        `No refunds found for Stripe charge: ${charge.id}`,
      )

    // Insert a refund entry if needed
    for (const refund of charge.refunds.data) {
      const existingRefund = await fastify.db.query.refunds.findFirst({
        where: and(
          eq(refunds.paymentId, payment.id),
          eq(refunds.transactionId, refund.id),
        ),
      })

      if (!existingRefund) {
        await fastify.db.insert(refunds).values({
          orderId: payment.orderId,
          paymentId: payment.id,
          transactionId: refund.id,
          status: "completed",
          amount: refund.amount,
          currencyCode: refund.currency.toUpperCase(),
          reason: refund.reason ?? null,
          refundedAt: new Date().toISOString(),
        })
      }
    }
  } catch (error) {
    fastify.log.error(error, "Failed to handle charge.refunded event")
    throw error
  }
}
