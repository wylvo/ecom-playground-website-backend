import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify"
import fastifyPlugin from "fastify-plugin"

type TurnstileResult = {
  success: boolean
  challenge_ts: string
  hostname: string
  "error-codes": string[]
  action: string
  cdata: string
}

declare module "fastify" {
  interface FastifyInstance {
    verifyTurnstile: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>
  }
}

const turnstilePlugin: FastifyPluginAsync = async (fastify) => {
  const secret = fastify.env.CLOUDFLARE_TURNSTILE_SECRET_KEY
  const verifyUrl = fastify.env.CLOUDFLARE_TURNSTILE_SITE_VERIFY_ENDPOINT

  if (!secret || !verifyUrl) throw new Error("Missing Turnstile env vars")

  fastify.decorate(
    "verifyTurnstile",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const token = (request.body as any)?.token

      if (!token)
        return reply
          .code(400)
          .send({ success: false, message: "Missing token" })

      try {
        const res = await fetch(verifyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret, response: token }),
        })

        if (!res.ok)
          return reply
            .code(400)
            .send({ success: false, message: "Token verification failed" })

        const result = (await res.json()) as TurnstileResult

        if (!result.success)
          return reply
            .code(401)
            .send({ success: false, message: "Token verification failed" })
      } catch (err) {
        fastify.log.error(err)
        return reply
          .code(500)
          .send({ success: false, message: "Something went wrong" })
      }
    },
  )
}

export default fastifyPlugin(turnstilePlugin, {
  name: "turnstile-token",
  dependencies: ["env"],
})
