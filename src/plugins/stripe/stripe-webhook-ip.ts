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

  // List of IP addresses that webhook notifications may come from
  // https://docs.stripe.com/ips#webhook-notifications
  const whitelistedStripeWebhookIpAddresses = fastify.makeImmutableSet([
    "3.18.12.63",
    "3.130.192.231",
    "13.235.14.237",
    "13.235.122.149",
    "18.211.135.69",
    "35.154.171.200",
    "52.15.183.38",
    "54.88.130.119",
    "54.88.130.237",
    "54.187.174.169",
    "54.187.205.235",
    "54.187.216.72",
  ])

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
