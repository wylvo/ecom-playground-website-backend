import type { FastifyRequest, FastifyReply, FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"
import { CartItems } from "@/types/cart-items"
import { cartItems, carts, productVariants } from "@/db/schema"
import { eq } from "drizzle-orm"

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    verifyCheckoutCart: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>
  }
  interface FastifyRequest {
    cartItems?: CartItems
  }
}

const checkoutCartPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate(
    "verifyCheckoutCart",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authUserId = request.user.sub

        const cart = await fastify.db.query.carts.findFirst({
          where: eq(carts.authUserId, authUserId),
        })

        if (!cart)
          return reply.code(404).send({
            success: false,
            message: "Cart not found",
          })

        const items = await fastify.db
          .select({
            id: cartItems.id,
            quantity: cartItems.quantity,
            productVariant: {
              id: productVariants.id,
              stripeProductId: productVariants.stripeProductId,
              stripePriceId: productVariants.stripePriceId,
              name: productVariants.name,
              price: productVariants.price,
              discountPrice: productVariants.discountPrice,
              inventoryQuantity: productVariants.inventoryQuantity,
              weight: productVariants.weight,
              weightUnit: productVariants.weightUnit,
              grams: productVariants.grams,
              isShippingRequired: productVariants.isShippingRequired,
              isActive: productVariants.isActive,
              isVisible: productVariants.isVisible,
            },
          })
          .from(cartItems)
          .innerJoin(
            productVariants,
            eq(cartItems.productVariantId, productVariants.id),
          )
          .where(eq(cartItems.cartId, cart.id))
          .limit(500)

        if (items.length === 0)
          return reply.code(400).send({
            success: false,
            message: "Your cart is empty",
          })

        const hasInactiveOrInvisibleItems = items.some(
          (item) =>
            !item.productVariant.isActive || item.productVariant.isVisible,
        )
        if (hasInactiveOrInvisibleItems)
          return reply.code(400).send({
            success: false,
            message: "Some items in your cart are unavailable",
          })

        request.cartItems = items
      } catch (err) {
        fastify.log.error(err)
        return reply.code(500).send({
          success: false,
          error: "Something went wrong verifying your cart",
        })
      }
    },
  )
}

export default fastifyPlugin(checkoutCartPlugin, { name: "checkout-cart" })
