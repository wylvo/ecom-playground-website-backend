import { orders } from "@/db/schema"
import { count, eq, and, gte } from "drizzle-orm"
import type { FastifyRequest, FastifyReply, FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    verifyCheckoutPendingOrderLimit: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>
  }
}

const checkoutPendingOrderLimitPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate(
    "verifyCheckoutPendingOrderLimit",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const now = new Date().getTime()
      const twentyFourHours = 1000 * 60 * 60 * 24
      const twentyFourHoursAgo = new Date(now - twentyFourHours).toISOString()

      const [pendingSessionsCount] = await fastify.db
        .select({
          value: count(),
        })
        .from(orders)
        .where(
          and(
            eq(orders.financialStatus, "pending"),
            eq(orders.clientIp, request.ip),
            gte(orders.createdAt, twentyFourHoursAgo),
          ),
        )

      fastify.log.info(
        `Pending session count for IP: ${request.ip} is ${pendingSessionsCount.value} session(s)`,
      )

      if (
        pendingSessionsCount.value >=
        fastify.env.STRIPE_MAX_PENDING_CHECKOUT_SESSIONS_PER_IP_PER_DAY
      )
        return reply.code(429).send({
          success: false,
          message: "Too many pending checkout attempts! Please try again later",
        })
    },
  )
}
export default fastifyPlugin(checkoutPendingOrderLimitPlugin, {
  name: "checkout-pending-order-limit",
  dependencies: ["env", "database", "auth"],
})
