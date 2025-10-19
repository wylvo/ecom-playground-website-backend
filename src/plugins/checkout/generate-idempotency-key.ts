import type { FastifyPluginCallback } from "fastify"
import fastifyPlugin from "fastify-plugin"
import { createHash } from "node:crypto"

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    generateIdempotencyKey: (authUserId: string, cartHash: string) => string
  }
}

const checkoutGenerateIdempotencyKeyPlugin: FastifyPluginCallback = (
  fastify,
  _opts,
  done,
) => {
  fastify.decorate(
    "generateIdempotencyKey",
    (authUserId: string, cartHash: string): string => {
      return createHash("sha256")
        .update(`${authUserId}-${cartHash}`)
        .digest("hex")
    },
  )

  done()
}

export default fastifyPlugin(checkoutGenerateIdempotencyKeyPlugin, {
  name: "checkout-generate-idempotency-key",
  dependencies: ["database", "auth", "checkout-cart"],
})
