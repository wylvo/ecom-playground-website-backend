import fastifyPlugin from "fastify-plugin"
import Stripe from "stripe"
import type { FastifyPluginCallback } from "fastify"

declare module "fastify" {
  interface FastifyInstance {
    stripe: Stripe
    stripeWebhookSecret: string
  }
}

const stripePlugin: FastifyPluginCallback = (fastify, _options, done) => {
  const apiVersion = fastify.env.STRIPE_API_VERSION as "2025-09-30.clover"

  if (fastify.env.NODE_ENV === "development") {
    const testSecretKey = fastify.env.STRIPE_TEST_SECRET_KEY
    const testwebhookSecret = fastify.env.STRIPE_TEST_WEBHOOK_SECRET

    if (!testSecretKey) {
      fastify.log.error(
        "Missing STRIPE_TEST_SECRET_KEY in environment variables",
      )
      throw new Error("Stripe test secret key not found")
    }

    if (!testwebhookSecret) {
      fastify.log.error(
        "Missing STRIPE_TEST_WEBHOOK_SECRET in environment variables",
      )
      throw new Error("Stripe test webhook secret not found")
    }

    const stripe = new Stripe(testSecretKey, {
      apiVersion: apiVersion,
    })

    fastify.decorate("stripe", stripe)
    fastify.decorate("stripeWebhookSecret", testwebhookSecret)

    fastify.log.info("Stripe client initialized with TEST secret key")
  } else {
    const liveSecretKey = fastify.env.STRIPE_LIVE_SECRET_KEY
    const livewebhookSecret = fastify.env.STRIPE_LIVE_WEBHOOK_SECRET

    if (!liveSecretKey) {
      fastify.log.error(
        "Missing STRIPE_LIVE_SECRET_KEY in environment variables",
      )
      throw new Error("Stripe live secret key not found")
    }

    if (!livewebhookSecret) {
      fastify.log.error(
        "Missing STRIPE_LIVE_WEBHOOK_SECRET in environment variables",
      )
      throw new Error("Stripe live webhook secret not found")
    }

    const stripe = new Stripe(liveSecretKey, {
      apiVersion: apiVersion,
    })

    fastify.decorate("stripe", stripe)
    fastify.decorate("stripeWebhookSecret", livewebhookSecret)

    fastify.log.info("Stripe client initialized with LIVE secret key")
  }

  done()
}

export default fastifyPlugin(stripePlugin, {
  name: "stripe",
  dependencies: ["env", "database"],
})
