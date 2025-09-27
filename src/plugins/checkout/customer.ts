import { customers } from "@/db/schema"
import { CheckoutBodySchema } from "@/routes/checkout"
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
        const { sub: authUserId, is_anonymous: isAnonymous } = request.user
        const body = request.body as CheckoutBodySchema

        let customer = await fastify.db.query.customers.findFirst({
          where: eq(customers.email, body.email),
        })

        if (!customer) {
          const [newCustomer] = await fastify.db
            .insert(customers)
            .values({
              authUserId,
              email: body.email,
              ...(body.phone_number && { phoneNumber: body.phone_number }),
            })
            .returning()

          request.customer = newCustomer
        } else {
          // If user is anonymous and using an email from an existing customer
          if (isAnonymous) request.customer = undefined

          // Else attach customer
          if (!isAnonymous) request.customer = customer
        }
      } catch (err) {
        fastify.log.error(err)
        return reply.code(500).send({
          success: false,
          error: "Something went wrong verifying the customer",
        })
      }
    },
  )
}

export default fastifyPlugin(checkoutCustomerPlugin, {
  name: "checkout-customer",
})
