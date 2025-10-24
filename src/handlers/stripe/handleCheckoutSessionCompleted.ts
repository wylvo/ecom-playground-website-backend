import { StripeHandler } from "@/types/stripe-handler"
import Stripe from "stripe"
import { and, eq } from "drizzle-orm"
import {
  carts,
  cartItems,
  orders,
  payments,
  promotionRedemptions,
  promotions,
} from "@/db/schema"

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
    if (order.status === "paid" || order.financialStatus === "paid")
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
    const shippingAddress =
      session.collected_information.shipping_details.address
    const shippingFullName = session.collected_information.shipping_details.name
    const billingAddress = charge.billing_details.address
    const billingFullName = charge.billing_details.name

    // Check if shipping address matches billing address
    if (
      shippingFullName === billingFullName &&
      shippingAddress.line1 === billingAddress.line1 &&
      shippingAddress.line2 === billingAddress.line2 &&
      shippingAddress.city === billingAddress.city &&
      shippingAddress.state === billingAddress.state &&
      shippingAddress.postal_code === billingAddress.postal_code &&
      shippingAddress.country === billingAddress.country
    ) {
      billingAddressMatchesShippingAddress = true
    }

    // Update the order state
    await fastify.db
      .update(orders)
      .set({
        status: "paid",
        financialStatus: "paid",
        stripePaymentStatus: session.payment_status,

        shippingFullName: shippingFullName,
        shippingAddressLine1: shippingAddress.line1,
        shippingAddressLine2: shippingAddress.line2,
        shippingCity: shippingAddress.city,
        shippingRegionName: null,
        shippingRegionCode: shippingAddress.state,
        shippingZip: shippingAddress.postal_code.split(" ").join(""),
        shippingCountryName: null,
        shippingCountryCode: shippingAddress.country,

        billingAddressMatchesShippingAddress,

        billingFullName: billingFullName,
        billingAddressLine1: billingAddress.line1,
        billingAddressLine2: billingAddress.line2,
        billingCity: billingAddress.city,
        billingRegionName: null,
        billingRegionCode: billingAddress.state,
        billingZip: billingAddress.postal_code.split(" ").join(""),
        billingCountryName: null,
        billingCountryCode: billingAddress.country,

        amountSubtotal: session.amount_subtotal,
        amountDiscount: session.total_details.amount_discount,
        amountShipping: session.total_details.amount_shipping,
        amountTax: session.total_details.amount_tax,
        amountTotal: session.amount_total,

        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, order.id))

    session.discounts.map(async (discount) => {
      if (discount.coupon) {
        const promotion = await fastify.db.query.promotions.findFirst({
          where: eq(promotions.stripeCouponId, discount.coupon as string),
        })

        await fastify.db.insert(promotionRedemptions).values({
          orderId: order.id,
          authUserId: order.authUserId,
          promotionId: promotion.id,
          promotionCode: promotion.code,
          promotionStripeCouponId: promotion.stripeCouponId,
          promotionType: promotion.type,
          promotionValue: promotion.value,
          promotionCurrencyCode: promotion.currencyCode,
        })
      }
    })

    // Clear the cart items, and modify updatedAt column timestamp
    const cart = await fastify.db.query.carts.findFirst({
      where: eq(carts.authUserId, order.authUserId),
    })

    if (!cart || !cart?.id)
      return fastify.log.warn(
        `No cart found for user: ${order.authUserId}. Not clearing the cart`,
      )

    const theCartItems = await fastify.getCartItems(cart.id)
    const currentCartHash = fastify.generateCartHash(
      order.authUserId,
      theCartItems,
    )

    if (currentCartHash !== order.cartHash)
      fastify.log.warn(
        `Cart items updated before checkout was completed for user: ${order.authUserId}. Not clearing the cart`,
      )

    if (currentCartHash === order.cartHash) {
      await fastify.db.delete(cartItems).where(eq(cartItems.cartId, cart.id))
      fastify.log.warn(`Cart items cleared for user: ${order.authUserId}`)
    }

    await fastify.db
      .update(carts)
      .set({
        updatedAt: new Date().toISOString(), // Necessary to generate a unique order idempotency key
      })
      .where(eq(carts.authUserId, order.authUserId))

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
