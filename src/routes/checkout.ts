import { customers } from "@/db/schema"
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
  shipping_region: requiredString(),
  shipping_region_code: optionalString(2),
  shipping_zip: requiredString(1, 6),
  shipping_country: requiredString(),

  billing_address_matches_shipping_address: z.boolean(),

  billing_full_name: requiredString(2),
  billing_company: optionalString(),
  billing_address_line_1: requiredString(),
  billing_address_line_2: optionalString(),
  billing_city: requiredString(),
  billing_region: requiredString(),
  billing_region_code: optionalString(2),
  billing_zip: requiredString(1, 6),
  billing_country: requiredString(),

  shipping_method_options: z.enum(["delivery", "pick_up"]),

  promotion_code: optionalString(),

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
      // fastify.verifyCheckoutExistingOrder,
      fastify.verifyCheckoutPromotion,
      fastify.verifyCheckoutCart,
      // fastify.verifyCheckoutShippingAddress,
      fastify.verifyCheckoutCustomer,
      fastify.verifyCheckoutStripeCustomer,
    ],
    handler: async (request, reply) => {
      try {
        const body = request.body as CheckoutBodySchema

        // For stripe
        const { sub: authUserId, is_anonymous: isAnonymous } = request.user
        const shouldCreateStripeCustomer = request.shouldCreateStripeCustomer
        let stripeCustomer: Stripe.Response<Stripe.Customer>

        // For subtotal, order products
        const cartItems = request.cartItems

        // For discount subtotal
        const promotion = request.promotion

        await fastify.db.transaction(async (tx) => {
          // Check if we have to create a stripe customer
          if (shouldCreateStripeCustomer) {
            stripeCustomer = await fastify.stripe.customers.create({
              email: body.email,
              metadata: {
                isAnonymous: String(isAnonymous as boolean),
                authUserId,
              },
            })

            // Persist stripe customer id if user is not anonymous
            if (!isAnonymous) {
              await tx
                .update(customers)
                .set({ stripeCustomerId: stripeCustomer.id })
                .where(eq(customers.authUserId, authUserId))
            }
          }

          const stripeCustomerId =
            shouldCreateStripeCustomer && stripeCustomer
              ? stripeCustomer.id
              : request.stripeCustomerId

          // Compute subtotal
          let subtotal = 0
          for (const item of cartItems) {
            const unitPrice =
              item.productVariant.discountPrice ?? item.productVariant.price
            subtotal += unitPrice * item.quantity
          }

          // TODO: Compute discount total
          let discountTotal = 0
          let promotion = null

          // TODO: Compute tax total

          // TODO: Compute shipping total (will be 0 to begin with)

          // TODO: Compute total price (subtotal + discount + tax + shipping)

          // TODO: insert order

          // TODO: insert order products

          // TODO: create Stripe checkout session

          // TODO: save session id
        })
      } catch (err) {
        fastify.log.error(err)
        return reply.code(500).send({
          success: false,
          message: "Something went wrong while checking out",
        })
      }
    },
  })
}

// return reply
//   .code(201)
//   .send({ success: true, message: "Data received", data: body })
