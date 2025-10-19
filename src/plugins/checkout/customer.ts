import { customers } from "@/db/schema"
import { eq } from "drizzle-orm"
import type { FastifyRequest, FastifyReply, FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    verifyCheckoutCustomer: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>
  }
  interface FastifyRequest {
    customer?: (typeof customers)["$inferSelect"]
  }
}

const checkoutCustomerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate(
    "verifyCheckoutCustomer",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { is_anonymous: isAnonymous, email } = request.user

        if (isAnonymous || !email) return

        let customer = await fastify.db.query.customers.findFirst({
          where: eq(customers.email, email as string),
        })

        // if supabase user is not anonymous and customer found
        if (customer) request.customer = customer
      } catch (err) {
        fastify.log.error(err)
        return reply.code(500).send({
          success: false,
          message: "Something went wrong verifying the customer",
        })
      }
    },
  )
}

export default fastifyPlugin(checkoutCustomerPlugin, {
  name: "checkout-customer",
  dependencies: ["database", "auth"],
})
