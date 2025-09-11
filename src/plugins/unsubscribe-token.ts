import fastifyPlugin from "fastify-plugin"
import { SignJWT, jwtVerify } from "jose"
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify"
import { UnsubscribeBodySchema } from "@/routes/newsletter/unsubscribe.ts"

declare module "fastify" {
  interface FastifyInstance {
    createUnsubscribeToken: (email: string) => Promise<string>
    verifyUnsubscribeToken: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>
  }

  interface FastifyRequest {
    email?: string
  }
}

const unsubscribePlugin: FastifyPluginAsync = async (fastify) => {
  const secretKey = fastify.env.EMAIL_UNSUBSCRIBE_JWT_SECRET_KEY
  const expirationTime = fastify.env.EMAIL_UNSUBSCRIBE_JWT_EXPIRATION_TIME
  const secret = new TextEncoder().encode(secretKey)

  fastify.decorate("createUnsubscribeToken", async (email: string) => {
    return await new SignJWT({ email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(expirationTime)
      .sign(secret)
  })

  fastify.decorate(
    "verifyUnsubscribeToken",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const token = (request.body as UnsubscribeBodySchema).token

      if (!token)
        return reply
          .code(400)
          .send({ success: false, message: "Missing token" })

      try {
        const { payload } = await jwtVerify(token, secret)
        const email = payload.email as string

        if (!email)
          return reply
            .code(400)
            .send({ success: false, message: "Invalid token" })

        request.email = email
      } catch (err: any) {
        fastify.log.error(err)
        if (err?.code && err?.code === "ERR_JWT_EXPIRED")
          return reply.code(400).send({
            success: false,
            message: "The unsubscribe link has expired",
          })

        return reply
          .code(500)
          .send({ success: false, message: "Something went wrong" })
      }
    },
  )
}

export default fastifyPlugin(unsubscribePlugin, {
  name: "unsubscribe-token",
  dependencies: ["env"],
})
