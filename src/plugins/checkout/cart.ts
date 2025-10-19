import type { FastifyRequest, FastifyReply, FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"
import { CartItems } from "@/types/cart-items"
import {
  cartItems,
  carts,
  productImages,
  productVariantImages,
  productVariants,
} from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { createHash } from "node:crypto"

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    verifyCheckoutCart: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>
    generateCartHash: (authUserId: string, cartItems: CartItems) => string
  }
  interface FastifyRequest {
    cartItems?: CartItems
  }
}

const checkoutCartPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate(
    "generateCartHash",
    (authUserId: string, cartItems: CartItems): string => {
      const sortedItems = cartItems
        .map(({ productVariant, quantity }) => ({
          id: productVariant.id,
          price: productVariant.price,
          discountPrice: productVariant.discountPrice,
          stripePriceId: productVariant.stripePriceId,
          stripeProductId: productVariant.stripeProductId,
          isShippingRequired: productVariant.isShippingRequired,
          quantity,
        }))
        .sort((a, b) => a.id.localeCompare(b.id))

      const rawJson = JSON.stringify({ authUserId, items: sortedItems })
      return createHash("sha256").update(rawJson).digest("hex")
    },
  )

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
              sku: productVariants.sku,
              barcode: productVariants.barcode,
              weight: productVariants.weight,
              weightUnit: productVariants.weightUnit,
              grams: productVariants.grams,
              isShippingRequired: productVariants.isShippingRequired,
              isActive: productVariants.isActive,
              isVisible: productVariants.isVisible,

              image: {
                id: productImages.id,
                url: productImages.url,
                altText: productImages.altText,
              } as any,
            },
          })
          .from(cartItems)
          .innerJoin(
            productVariants,
            eq(cartItems.productVariantId, productVariants.id),
          )
          .leftJoin(
            productVariantImages,
            and(
              eq(productVariants.id, productVariantImages.productVariantId),
              eq(productVariantImages.sortOrder, 1),
            ),
          )
          .leftJoin(
            productImages,
            eq(productVariantImages.productImageId, productImages.id),
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
            !item.productVariant.isActive || !item.productVariant.isVisible,
        )
        if (hasInactiveOrInvisibleItems)
          return reply.code(400).send({
            success: false,
            message: "Some items in your cart are unavailable",
          })

        request.cartItems = items as CartItems
      } catch (err) {
        fastify.log.error(err)
        return reply.code(500).send({
          success: false,
          message: "Something went wrong verifying your cart",
        })
      }
    },
  )
}

export default fastifyPlugin(checkoutCartPlugin, {
  name: "checkout-cart",
  dependencies: ["database", "auth"],
})
