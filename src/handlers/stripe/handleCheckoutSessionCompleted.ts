import { StripeHandler } from "@/types/stripe-handler"
import Stripe from "stripe"
import { and, eq } from "drizzle-orm"
import { orders, payments } from "@/db/schema"

export default async function ({ fastify, event }: StripeHandler) {
  try {
    const session = event.data.object as Stripe.Checkout.Session
    const paymentIntentId = session.payment_intent as string

    if (!paymentIntentId)
      return fastify.log.error(
        `Missing payment_intent in Stripe checkout session: ${session.id}`,
      )

    const paymentIntent = await fastify.stripe.paymentIntents.retrieve(
      paymentIntentId,
      {
        expand: ["latest_charge"],
      },
    )

    const charge = paymentIntent.latest_charge as Stripe.Charge

    /**
      billing_details: {
        name: 'William Evora',
        address: {
          line1: '4-220 Rue de Beauharnois Ouest',
          line2: null,
          city: 'Montréal',
          state: 'QC'
          postal_code: 'H2N 1K2',
          country: 'CA',
        },
        email: 'williamevora93@gmail.com',
        phone: null,
        tax_id: null
      }
     */

    console.log("Charge:", charge)

    if (!charge)
      return fastify.log.error(
        `No charge found for payment intent: ${paymentIntentId}`,
      )

    // Find the order by checkout session id
    const order = await fastify.db.query.orders.findFirst({
      where: eq(orders.stripeCheckoutSessionId, session.id),
    })

    if (!order)
      return fastify.log.error(
        `No order found for Stripe checkout session: ${session.id}`,
      )

    // Prevent duplicate handling
    if (order.status === "paid" && order.financialStatus === "paid")
      return fastify.log.info(
        `Order: ${order.id} already marked as paid. Skipping`,
      )

    const existingPayment = await fastify.db.query.payments.findFirst({
      where: and(
        eq(payments.orderId, order.id),
        eq(payments.transactionId, charge.id),
      ),
    })

    // Insert a payment record (if not already inserted)
    if (!existingPayment) {
      await fastify.db.insert(payments).values({
        orderId: order.id,
        transactionId: charge.id,
        status: "paid",
        paymentMethod: "credit_card",
        provider: "stripe",
        amount: charge.amount ?? 0,
        currencyCode: charge.currency.toUpperCase(),
      })
    }

    let billingAddressMatchesShippingAddress = false
    if (
      order.shippingFullName === charge.billing_details.name &&
      order.shippingAddressLine1 === charge.billing_details.address.line1 &&
      order.shippingAddressLine2 === charge.billing_details.address.line2 &&
      order.shippingCity === charge.billing_details.address.city &&
      order.shippingRegionCode === charge.billing_details.address.state &&
      order.shippingZip ===
        charge.billing_details.address.postal_code.split(" ").join("") &&
      order.shippingCountryCode === charge.billing_details.address.country
    ) {
      billingAddressMatchesShippingAddress = true
    }

    // Update the order status and billing details
    await fastify.db
      .update(orders)
      .set({
        status: "paid",
        financialStatus: "paid",
        stripePaymentStatus: session.payment_status,

        billingAddressMatchesShippingAddress,

        ...(billingAddressMatchesShippingAddress
          ? {
              billingFullName: order.shippingFullName,
              billingAddressLine1: order.shippingAddressLine1,
              billingAddressLine2: order.shippingAddressLine2,
              billingCity: order.shippingCity,
              billingRegionName: order.shippingRegionName,
              billingRegionCode: order.shippingRegionCode,
              billingZip: order.shippingZip,
              billingCountryName: order.shippingCountryName,
              billingCountryCode: order.shippingCountryCode,
            }
          : {
              billingFullName: charge.billing_details.name,
              billingAddressLine1: charge.billing_details.address.line1,
              billingAddressLine2: charge.billing_details.address.line2,
              billingCity: charge.billing_details.address.city,
              billingRegionCode: charge.billing_details.address.state,
              billingZip: charge.billing_details.address.postal_code
                .split(" ")
                .join(""),
              billingCountryCode: charge.billing_details.address.country,
            }),

        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, order.id))

    fastify.log.info(
      `Successfully handled checkout.session.completed event for order: ${order.id}`,
    )
  } catch (error) {
    fastify.log.error(
      error,
      "Failed to handle checkout.session.completed event",
    )
    throw error
  }
}
