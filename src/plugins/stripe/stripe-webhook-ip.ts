import type { FastifyRequest, FastifyReply, FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"

function normalizeIp(ip: string) {
  if (ip.startsWith("::ffff:")) return ip.replace("::ffff:", "")
  return ip
}

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    verifyStripeWebhookIp: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>
  }
}

const stripeWebhookIpPlugin: FastifyPluginAsync = async (fastify) => {
  if (!fastify.env.STRIPE_WEBHOOK_IP_VERIFICATION) return // Skip check entirely

  if (!fastify.env.STRIPE_WEBHOOK_IP_ALLOW_LIST?.length)
    throw new Error("Missing Stripe webhook ip allow list env var")

  // List of IP addresses that webhook notifications may come from
  // https://docs.stripe.com/ips#webhook-notifications
  const whitelistedStripeWebhookIpAddresses = fastify.makeImmutableSet(
    fastify.env.STRIPE_WEBHOOK_IP_ALLOW_LIST,
  )

  fastify.decorate(
    "verifyStripeWebhookIp",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Verify that the sender is from a trusted Stripe IP
        // If using a proxy, allow IPs to be forwarded to the fastify server
        // and ensure fastify's 'trustProxy' config property is set/enabled
        const ip = normalizeIp(request.ip)
        const isWhitelisted = whitelistedStripeWebhookIpAddresses.has(ip)

        // If IP is not whitelisted do not expose endpoint with a valid status code
        if (!isWhitelisted)
          return reply.code(404).send({
            message: "Route GET:/ not found",
            error: "Not Found",
            statusCode: 404,
          })

        fastify.log.info(`Stripe webhook IP: ${ip} is authentic. Continuing`)
      } catch (error) {
        fastify.log.error(
          error,
          "Something went wrong verifying for the Stripe webhook sender IP address",
        )
        return reply
          .code(500)
          .send({ success: false, message: "Something went wrong" })
      }
    },
  )
}

export default fastifyPlugin(stripeWebhookIpPlugin, {
  name: "stripe-webhook-ip",
  dependencies: ["env", "immutable-set"],
})
