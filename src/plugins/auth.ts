import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose"
import type { FastifyRequest, FastifyReply, FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    verifyUser: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
  interface FastifyRequest {
    user?: JWTPayload
  }
}

const SUPABASE_JWT_KEYS = createRemoteJWKSet(
  new URL(process.env.SUPABASE_JWK_REMOTE_ENDPOINT!),
)

function verifySupabaseJWT(jwt: string) {
  return jwtVerify<JWTPayload>(jwt, SUPABASE_JWT_KEYS, {
    issuer: process.env.SUPABASE_JWT_ISSUER,
  })
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate(
    "verifyUser",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authHeader = request.headers.authorization
        if (!authHeader?.startsWith("Bearer ")) {
          return reply
            .code(401)
            .send({ success: false, message: "Missing or invalid auth token" })
        }

        const [, token] = authHeader.split(" ")

        if (!token)
          return reply
            .code(401)
            .send({ success: false, message: "Missing or invalid auth token" })

        const { payload } = await verifySupabaseJWT(token)

        request.user = payload // { sub, email, is_anonymous, ... }
      } catch (err) {
        fastify.log.error(err)
        return reply.code(401).send({ success: false, message: "Unauthorized" })
      }
    },
  )
}

export default fastifyPlugin(authPlugin, { name: "auth" })
