import { type FastifyInstance } from "fastify"
import z from "zod"
import { Resend } from "resend"

import type { ZodTypeProvider } from "fastify-type-provider-zod"

export type UnsubscribeBodySchema = z.infer<typeof unsubscribeBodySchema>

const unsubscribeBodySchema = z.strictObject({
  token: z.jwt({ alg: "HS256" }),
})

export default async function unsubscribe(fastify: FastifyInstance) {
  const resend = new Resend(fastify.env.RESEND_API_KEY)
  const audienceId = fastify.env.RESEND_AUDIENCE_ID

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/unsubscribe",
    schema: {
      body: unsubscribeBodySchema,
    },
    preHandler: [fastify.verifyUnsubscribeToken],
    handler: async (req, reply) => {
      const email = req.email!

      try {
        // Find the contact in the audience
        const existingContact = await resend.contacts.get({
          email,
          audienceId,
        })

        if (existingContact.error || !existingContact.data)
          return reply
            .code(404)
            .send({ success: false, message: "Email not found" })

        if (existingContact.data.unsubscribed) {
          // If already unsubscribed, reject the token
          return reply.code(400).send({
            success: false,
            message: "This email is already unsubscribed",
          })
        }

        // Mark the contact as unsubscribed
        const updatedContact = await resend.contacts.update({
          email,
          unsubscribed: true,
          audienceId,
        })

        if (updatedContact.error)
          return reply
            .code(500)
            .send({ success: false, message: "Unable to unsubscribe" })

        return reply
          .code(200)
          .send({ success: true, message: "Successfully unsubscribed" })
      } catch (err) {
        fastify.log.error(err)
        return reply
          .code(500)
          .send({ success: false, message: "Something went wrong" })
      }
    },
  })
}
