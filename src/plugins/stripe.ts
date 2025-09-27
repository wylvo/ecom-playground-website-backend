import fastifyPlugin from "fastify-plugin"
import Stripe from "stripe"
import type { FastifyPluginAsync } from "fastify"

declare module "fastify" {
  interface FastifyInstance {
    stripe: Stripe
  }
}

const stripePlugin: FastifyPluginAsync = async (fastify) => {
  const secretKey = fastify.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    fastify.log.error("Missing STRIPE_SECRET_KEY in environment variables")
    throw new Error("Stripe secret key not found")
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: "2025-08-27.basil",
  })

  fastify.decorate("stripe", stripe)

  fastify.log.info("Stripe client initialized")
}

export default fastifyPlugin(stripePlugin, {
  name: "stripe",
  dependencies: ["env", "database"],
})
