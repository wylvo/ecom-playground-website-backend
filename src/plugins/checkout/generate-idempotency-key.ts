import type { FastifyPluginCallback } from "fastify"
import fastifyPlugin from "fastify-plugin"
import { createHash } from "node:crypto"

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    generateIdempotencyKey: (
      authUserId: string,
      cartHash: string,
      cartUpdatedAt: string,
    ) => string
  }
}

const checkoutGenerateIdempotencyKeyPlugin: FastifyPluginCallback = (
  fastify,
  _opts,
  done,
) => {
  fastify.decorate(
    "generateIdempotencyKey",
    (authUserId: string, cartHash: string, cartUpdatedAt: string): string => {
      return createHash("sha256")
        .update(`${authUserId}:${cartHash}:${cartUpdatedAt}`)
        .digest("hex")
    },
  )

  done()
}

export default fastifyPlugin(checkoutGenerateIdempotencyKeyPlugin, {
  name: "checkout-generate-idempotency-key",
  dependencies: ["database", "auth", "checkout-cart"],
})
