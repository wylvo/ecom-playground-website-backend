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
}

const checkoutExistingOrderPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate(
    "verifyCheckoutExistingOrder",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authUserId = request.user.sub
        const idempotencyKey = ""

        // const [existingOrder] = await fastify.db
        //   .select()
        //   .from(orders)
        //   .where(
        //     and(
        //       eq(orders.authUserId, authUserId),
        //       eq(orders.idempotencyKey, idempotencyKey),
        //       eq(orders.status, "pending"),
        //       eq(orders.financialStatus, "pending"),
        //       eq(orders.fulfillmentStatus, "unfulfilled"),
        //     ),
        //   )
        //   .limit(1)

        const existingOrder = await fastify.db.query.orders.findFirst({
          where: and(
            eq(orders.authUserId, authUserId),
            eq(orders.idempotencyKey, idempotencyKey),
            eq(orders.status, "pending"),
            eq(orders.financialStatus, "pending"),
            eq(orders.fulfillmentStatus, "unfulfilled"),
          ),
        })

        if (existingOrder) {
          const session = await fastify.stripe.checkout.sessions.retrieve(
            existingOrder.stripeCheckoutSessionId,
          )

          return reply.code(200).send({
            success: true,
            message: "Pending existing order found",
            url: session.url,
          })
        }
      } catch (err) {
        fastify.log.error(err)
        return reply.code(500).send({
          success: false,
          error: "Something went wrong verifying for an existing order",
        })
      }
    },
  )
}

export default fastifyPlugin(checkoutExistingOrderPlugin, {
  name: "checkout-existing-order",
})
