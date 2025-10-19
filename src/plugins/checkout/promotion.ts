import { eq, or, and, count, desc, isNotNull } from "drizzle-orm"
import { orders, promotionRedemptions, promotions } from "@/db/schema"
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

        // Find a promotion code
        let promotion: typeof promotions.$inferSelect
        if (body.promotion_code) {
          promotion = await fastify.db.query.promotions.findFirst({
            where: and(
              eq(promotions.code, body.promotion_code),
              eq(promotions.isActive, true),
              isNotNull(promotions.stripeCouponId),
            ),
          })

          if (!promotion) {
            fastify.log.warn(
              `Supplied promotion code: ${body.promotion_code} does not exist`,
            )
            return
          }
        }

        if (!body.promotion_code) {
          promotion = await fastify.db.query.promotions.findFirst({
            where: and(
              eq(promotions.isActive, true),
              isNotNull(promotions.stripeCouponId),
            ),
            orderBy: [desc(promotions.value)],
          })

          if (!promotion) {
            fastify.log.info(`No active promotion code found`)
            return
          }
        }

        fastify.log.info(`Found active promotion code: ${promotion.code}`)

        // Verify validity of the promotion code
        const now = Date.now()
        const startsAt = new Date(promotion.startsAt).getTime()
        const endsAt = new Date(promotion.endsAt).getTime()

        const hasStarted = now >= startsAt
        const isExpired = now > endsAt

        if (!hasStarted || isExpired) {
          fastify.log.warn(
            `Promotion code: ${promotion.code} is unavailable yet or has expired`,
          )
          return
        }

        // Count the number of promotion redemptions
        const [promotionRedemptionCount] = await fastify.db
          .select({
            value: count(),
          })
          .from(promotionRedemptions)
          .where(
            or(
              eq(promotionRedemptions.promotionId, promotion.id),
              eq(promotionRedemptions.promotionCode, promotion.code),
            ),
          )

        if (promotionRedemptionCount.value >= promotion.usageLimit) {
          fastify.log.warn(
            `Promotion code: ${promotion.code} has reached its maximum usage limit`,
          )
          return
        }

        // Count the number of client IPs with a promotion applied on paid orders which roughly equates to usage limit per customer
        const [usageLimitPerCustomerCount] = await fastify.db
          .select({
            value: count(),
          })
          .from(orders)
          .where(
            and(
              eq(orders.status, "paid"),
              and(
                isNotNull(orders.promotionCode),
                eq(orders.promotionCode, promotion.code),
              ),
              and(isNotNull(orders.clientIp), eq(orders.clientIp, request.ip)),
            ),
          )

        if (
          usageLimitPerCustomerCount.value >= promotion.usageLimitPerCustomer
        ) {
          fastify.log.warn(
            `Promotion code: ${promotion.code} has reached its maximum usage limit for customer with IP: ${request.ip}`,
          )
          return
        }

        // Attach valid promotion to request
        request.promotion = promotion
      } catch (err) {
        fastify.log.error(err)
        return reply.code(500).send({
          success: false,
          message: "Something went wrong verifying the promotion code",
        })
      }
    },
  )
}

export default fastifyPlugin(checkoutPromotionPlugin, {
  name: "checkout-promotion",
  dependencies: ["database"],
})
