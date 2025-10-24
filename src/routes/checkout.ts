import { customers, orderProducts, orders } from "@/db/schema"
import { eq } from "drizzle-orm"
import { FastifyInstance } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import parsePhoneNumber from "libphonenumber-js"
import Stripe from "stripe"
import z from "zod"

const maximumLength = 255
const minimumLength = 1
const requiredString = (minLength = minimumLength, maxLength = maximumLength) =>
  z
    .string()
    .trim()
    .min(minLength, { error: "Required" })
    .max(maxLength, { error: "Too long" })

const optionalString = (maxLength = maximumLength) =>
  z.string().trim().max(maxLength, { error: "Too long" }).optional()

export type CheckoutBodySchema = z.infer<typeof checkoutBodySchema>

const checkoutBodySchema = z.strictObject({
  email: z.email(),

  // https://github.com/colinhacks/zod/issues/3378#issuecomment-2067591844
  phone_number: z.string().transform((value, ctx) => {
    const phoneNumber = parsePhoneNumber(value, {
      defaultCountry: "CA",
    })
    if (!phoneNumber?.isValid()) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid phone number",
      })
      return z.NEVER
    }
    return phoneNumber.format("E.164")
  }),

  accepts_marketing: z.boolean(),

  shipping_full_name: requiredString(2),
  shipping_company: optionalString(),
  shipping_address_line_1: requiredString(),
  shipping_address_line_2: optionalString(),
  shipping_city: requiredString(),
  shipping_region_name: requiredString(),
  shipping_region_code: requiredString(2, 2),
  shipping_zip: requiredString(1, 6),
  shipping_country_name: requiredString(),
  shipping_country_code: requiredString(2, 2),

  billing_address_matches_shipping_address: z.boolean().optional(),

  billing_full_name: optionalString(),
  billing_company: optionalString(),
  billing_address_line_1: optionalString(),
  billing_address_line_2: optionalString(),
  billing_city: optionalString(),
  billing_region_name: optionalString(),
  billing_region_code: optionalString(2),
  billing_zip: optionalString(6),
  billing_country_name: optionalString(),
  billing_country_code: optionalString(2),

  shipping_method_options: z.enum(["delivery", "pick_up"]),

  promotion_code: optionalString(),

  locale: z.enum(["fr-CA", "en-CA"]),

  token: z.string(), // turnstile
})

export default async function checkout(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/checkout",
    schema: {
      body: checkoutBodySchema,
    },
    preHandler: [
      // fastify.verifyTurnstile,
      fastify.verifyUser,
      fastify.verifyCheckoutPendingOrderLimit,
      fastify.verifyCheckoutCart,
      fastify.verifyCheckoutExistingOrder,
      fastify.verifyCheckoutPromotion,
      fastify.verifyCheckoutCustomer,
      fastify.verifyCheckoutStripeCustomer,
    ],
    handler: async (request, reply) => {
      try {
        const body = request.body as CheckoutBodySchema
        const isTest = fastify.env.NODE_ENV === "development" ? true : false
        const currencyCode = "CAD"

        // For Stripe
        const {
          sub: authUserId,
          is_anonymous: isAnonymous,
          email,
        } = request.user
        const shouldCreateStripeCustomer = request.shouldCreateStripeCustomer
        let stripeCustomer: Stripe.Response<Stripe.Customer>

        // For Stripe and orders
        const customer = request.customer

        // For idempotency key
        const cart = request.cart

        // For subtotal price, shipping total and order products
        const cartItems = request.cartItems

        // For discount total
        const promotion = request.promotion

        // For tax total
        const taxRates = request.taxRates

        const result = await fastify.db.transaction(async (tx) => {
          // Check if we have to create a stripe customer
          if (shouldCreateStripeCustomer) {
            stripeCustomer = await fastify.stripe.customers.create({
              ...(isAnonymous
                ? { name: "Anonymous/Guest", email: body.email }
                : { name: body.shipping_full_name, email: email as string }),
              metadata: {
                isAnonymous: String(isAnonymous as boolean),
                authUserId,
              },
            })

            // Persist stripe customer id if has customer & supabase user is not anonymous
            if (customer && !isAnonymous) {
              await tx
                .update(customers)
                .set({ stripeCustomerId: stripeCustomer.id })
                .where(eq(customers.authUserId, customer.authUserId))
            }
          }

          const stripeCustomerId =
            shouldCreateStripeCustomer && stripeCustomer
              ? stripeCustomer.id
              : request.stripeCustomerId

          // Compute subtotal
          let amountSubtotal = 0
          for (const item of cartItems) {
            const unitPrice =
              item.productVariant.discountPrice ?? item.productVariant.price
            amountSubtotal += unitPrice * item.quantity
          }

          // Compute discount total
          let amountDiscount = 0
          if (promotion) {
            if (promotion.type === "percentage")
              amountDiscount = Math.floor(
                amountSubtotal * (promotion.value / 100),
              )
            else if (promotion.type === "fixed_amount")
              amountDiscount = promotion.value
          }

          // Compute tax total
          let amountTax = 0
          if (taxRates) {
            const regionTaxRate: any = taxRates?.find(
              (taxRate) =>
                taxRate.region?.code &&
                taxRate.region.code === body.shipping_region_code &&
                taxRate.country?.name === body.shipping_country_name,
            )?.rate
            const countryTaxRate: any = taxRates?.find(
              (taxRate) =>
                !taxRate.region?.code &&
                taxRate.country?.name === body.shipping_country_name,
            )?.rate

            const countryTaxTotal =
              amountSubtotal * ((countryTaxRate ?? 0) / 100)
            const regionTaxTotal = amountSubtotal * ((regionTaxRate ?? 0) / 100)

            amountTax = Number((countryTaxTotal + regionTaxTotal).toFixed(0))
          }

          // Compute shipping total
          const amountShipping = 0

          // Compute additional fees total
          const amountAdditionalFees = 0

          // Compute total price
          const amountTotal = Number(
            (
              amountSubtotal -
              amountDiscount +
              amountTax +
              amountShipping
            ).toFixed(0),
          )

          let idempotencyKey = request?.idempotencyKey
          let cartHash = request?.cartHash
          if (!idempotencyKey) {
            if (!cartHash)
              cartHash = fastify.generateCartHash(authUserId, cartItems)

            idempotencyKey = fastify.generateIdempotencyKey(
              authUserId,
              cartHash,
              cart.updatedAt,
            )

            fastify.log.info(`Cart Hash (Checkout): ${cartHash}`)
            fastify.log.info(`Idempotency Key (Checkout): ${idempotencyKey}`)
          }

          // Insert order
          const [order] = await tx
            .insert(orders)
            .values({
              ...(customer && { customerId: customer.id }),
              authUserId,
              status: "pending",
              financialStatus: "pending",
              fulfillmentStatus: "unfulfilled",

              idempotencyKey,
              cartHash,
              cartItems,

              email: body.email,
              phoneNumber: body.phone_number,
              acceptsMarketing: body.accepts_marketing,

              // shippingFullName: body.shipping_full_name,
              // shippingCompany: body.shipping_company || null,
              // shippingAddressLine1: body.shipping_address_line_1,
              // shippingAddressLine2: body.shipping_address_line_2 || null,
              // shippingCity: body.shipping_city,
              // shippingRegionName: body.shipping_region_name,
              // shippingRegionCode: body.shipping_region_code,
              // shippingZip: body.shipping_zip,
              // shippingCountryName: body.shipping_country_name,
              // shippingCountryCode: body.shipping_country_code,

              // billingAddressMatchesShippingAddress:
              //   body.billing_address_matches_shipping_address,

              // billingFullName: body.billing_full_name,
              // billingCompany: body.billing_company,
              // billingAddressLine1: body.billing_address_line_1,
              // billingAddressLine2: body.billing_address_line_2,
              // billingCity: body.billing_city,
              // billingRegionName: body.billing_region_name,
              // billingRegionCode: body.billing_region_code,
              // billingZip: body.billing_zip,
              // billingCountryName: body.billing_country_name,
              // billingCountryCode: body.billing_country_code,

              ...(promotion &&
                amountDiscount > 0 && {
                  promotionId: promotion.id,
                  promotionCode: promotion.code,
                  promotionType: promotion.type,
                  promotionValue: promotion.value,
                  promotionCurrencyCode: currencyCode,
                }),

              locale: body.locale,
              orderNumber: fastify.generateOrderNumber(),
              source: "ecom",
              isTest,

              amountSubtotal,
              amountDiscount,
              amountTax,
              amountShipping,
              amountAdditionalFees,
              amountTotal,

              amountRefunded: 0,

              currencyCode,
              taxesIncluded: false,
              isTaxExempt: false,

              clientIp: request.ip,
            })
            .returning()

          // Insert order products
          await tx.insert(orderProducts).values(
            cartItems.map(
              (cartItem) =>
                ({
                  orderId: order.id,
                  productVariantId: cartItem.productVariant.id,
                  productVariantName: cartItem.productVariant.name,
                  productVariantSku: cartItem.productVariant.sku,
                  productVariantImageUrl: cartItem.productVariant.image.url,
                  productVariantImageAltText:
                    cartItem.productVariant.image.altText,
                  quantity: cartItem.quantity,
                  price:
                    cartItem.productVariant.discountPrice ??
                    cartItem.productVariant.price,
                }) as (typeof orderProducts)["$inferInsert"],
            ),
          )

          // Create Stripe checkout session
          const stripeSession = await fastify.stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            client_reference_id: order.id,
            success_url: `${fastify.env.FRONTEND_ENDPOINT}/checkout/success?orderId=${order.id}`,
            cancel_url: `${fastify.env.FRONTEND_ENDPOINT}/checkout/shipping`,

            line_items: cartItems.map((item) => ({
              price: item.productVariant.stripePriceId,
              quantity: item.quantity,
            })),

            // locale: body.locale as "fr-CA",

            // Collect shipping and billing addresses
            shipping_address_collection: { allowed_countries: ["CA"] },
            billing_address_collection: "required",

            // To allow Stripe to calculate taxes based on shipping address
            automatic_tax: {
              enabled: true,
            },
            customer_update: {
              shipping: "auto",
            },

            // stripeCustomerId should never be undefined, but just to be safe...
            ...(stripeCustomerId
              ? { customer: stripeCustomerId }
              : { customer_email: body.email }),

            // Condtionally apply discount to the session
            ...(promotion?.stripeCouponId
              ? { discounts: [{ coupon: promotion.stripeCouponId }] }
              : null),
          })

          // Save Stripe session id
          await tx
            .update(orders)
            .set({
              stripeCheckoutSessionId: stripeSession.id,
              stripeCheckoutSessionUrl: stripeSession.url,
              stripePaymentStatus: stripeSession.payment_status,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(orders.id, order.id))

          return {
            success: true,
            message: "Checkout session created successfully",
            url: stripeSession.url,
          }
        })

        return reply.code(201).send(result)
      } catch (err) {
        fastify.log.error(err)
        console.error(err)
        return reply.code(500).send({
          success: false,
          message: "Something went wrong while checking out",
        })
      }
    },
  })
}
