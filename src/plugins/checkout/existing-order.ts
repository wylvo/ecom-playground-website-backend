import { orders } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import type { FastifyRequest, FastifyReply, FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    verifyCheckoutExistingOrder: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>
  }

  interface FastifyRequest {
    cartHash?: string
    idempotencyKey?: string
    existingOrder?: typeof orders.$inferSelect
  }
}

const checkoutExistingOrderPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate(
    "verifyCheckoutExistingOrder",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authUserId = request.user.sub
        const cart = request.cart
        const cartItems = request.cartItems

        if (!cartItems)
          return reply.code(404).send({
            success: false,
            message: "Cart not found",
          })

        const cartHash = fastify.generateCartHash(authUserId, cartItems)
        const idempotencyKey = fastify.generateIdempotencyKey(
          authUserId,
          cartHash,
          cart.updatedAt,
        )
        request.cartHash = cartHash
        request.idempotencyKey = idempotencyKey

        fastify.log.info(`Cart Hash: ${cartHash}`)
        fastify.log.info(`Idempotency Key: ${idempotencyKey}`)

        const existingOrder = await fastify.db.query.orders.findFirst({
          where: and(
            eq(orders.authUserId, authUserId),
            eq(orders.idempotencyKey, idempotencyKey),
            eq(orders.status, "pending"),
            eq(orders.financialStatus, "pending"),
            eq(orders.fulfillmentStatus, "unfulfilled"),
          ),
        })

        if (existingOrder && existingOrder.status === "pending") {
          const url = existingOrder?.stripeCheckoutSessionUrl
            ? existingOrder.stripeCheckoutSessionUrl
            : (
                await fastify.stripe.checkout.sessions.retrieve(
                  existingOrder.stripeCheckoutSessionId,
                )
              ).url

          if (!url)
            return fastify.log.error(
              "Existing order found but unable to resolve a Stripe checkout session URL",
            )

          fastify.log.info(
            `Existing order found with idempotency key: ${existingOrder.idempotencyKey}`,
          )

          return reply.code(200).send({
            success: true,
            message: "Existing order found",
            url,
          })
        }
      } catch (err) {
        fastify.log.error(err)
        return reply.code(500).send({
          success: false,
          message: "Something went wrong verifying for an existing order",
        })
      }
    },
  )
}

export default fastifyPlugin(checkoutExistingOrderPlugin, {
  name: "checkout-existing-order",
  dependencies: ["database", "auth", "checkout-cart"],
})
