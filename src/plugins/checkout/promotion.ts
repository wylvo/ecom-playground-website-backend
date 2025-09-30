import { eq } from "drizzle-orm"
import { promotions } from "@/db/schema"
import { CheckoutBodySchema } from "@/routes/checkout"
import type { FastifyRequest, FastifyReply, FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    verifyCheckoutPromotion: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>
  }
  interface FastifyRequest {
    promotion?: (typeof promotions)["$inferSelect"]
  }
}

const checkoutPromotionPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate(
    "verifyCheckoutPromotion",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = request.body as CheckoutBodySchema

        if (body.promotion_code) {
          const promotion = await fastify.db.query.promotions.findFirst({
            where: eq(promotions.code, body.promotion_code),
          })

          if (!promotion)
            return reply.code(404).send({
              success: false,
              message: "Promotion code does not exist",
            })

          const now = Date.now()
          const startsAt = new Date(promotion.startsAt).getTime()
          const endsAt = new Date(promotion.endsAt).getTime()

          const hasStarted = now >= startsAt
          const isExpired = now > endsAt

          if (!promotion.isActive || !hasStarted || isExpired)
            return reply.code(400).send({
              success: false,
              message: "Promotion code is unavailable or has expired",
            })

          // Attach valid promotion to request
          request.promotion = promotion
        }
      } catch (err) {
        fastify.log.error(err)
        return reply.code(500).send({
          success: false,
          error: "Something went wrong verifying the promotion code",
        })
      }
    },
  )
}

export default fastifyPlugin(checkoutPromotionPlugin, {
  name: "checkout-promotion",
})
