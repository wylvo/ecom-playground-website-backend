import type { FastifyInstance } from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import z from "zod"

const { npm_package_version: version } = process.env

export default async function status(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/status",
    schema: {
      response: {
        200: z.object({
          status: z.string(),
          version: z.string(),
        }),
      },
    },
    handler: (req, res) => {
      return { status: "ok", version: version as string }
    },
  })
}
