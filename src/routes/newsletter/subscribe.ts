import { type FastifyInstance } from "fastify"
import z from "zod"
import { CreateContactResponse, Resend, UpdateContactResponse } from "resend"

import domains from "@/plugins/disposable-domains/index.json" with { type: "json" }
import wildcards from "@/plugins/disposable-domains/wildcard.json" with { type: "json" }
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import Welcome from "@/emails/welcome"

const blockedDomains = new Set([...domains, ...wildcards])

type SubscribeBody = z.infer<typeof subscribeBodySchema>

const subscribeBodySchema = z.strictObject({
  email: z.email().refine((email) => {
    const [, domain] = email.split("@")

    if (!domain) return false // invalid email, though zod should already catch this
    if (blockedDomains.has(domain)) return false

    return true
  }, "Unable to subscribe this email address"),

  firstName: z.string().max(50).optional(),
  token: z.string(),
})

export default async function subscribe(fastify: FastifyInstance) {
  const resend = new Resend(fastify.env.RESEND_API_KEY)
  const audienceId = fastify.env.RESEND_AUDIENCE_ID
  const from = fastify.env.WELCOME_EMAIL_FROM
  const subject = fastify.env.WELCOME_EMAIL_SUBJECT

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/subscribe",
    schema: {
      body: subscribeBodySchema,
    },
    preHandler: [fastify.verifyTurnstile],
    handler: async (req, reply) => {
      const body = req.body as SubscribeBody
      let contact: UpdateContactResponse | CreateContactResponse

      try {
        // Find the contact in the audience
        const existingContact = await resend.contacts.get({
          email: body.email,
          audienceId,
        })

        if (existingContact.data) {
          if (existingContact.data.unsubscribed === false)
            // Already subscribed
            return { success: true }
          else
            // Mark existing contact as subscribed again
            contact = await resend.contacts.update({
              email: body.email,
              ...(body.firstName && { firstName: body.firstName }),
              unsubscribed: false,
              audienceId,
            })
        } else {
          // Create a new contact
          contact = await resend.contacts.create({
            email: body.email,
            firstName: body.firstName || "",
            unsubscribed: false,
            audienceId,
          })

          // Send a welcome email with a link to unsubscribe
          const unsubscribeToken = await fastify.createUnsubscribeToken(
            body.email,
          )

          // TODO: Remove arbitrary wait time
          fastify.log.info("Waiting 1 second to prevent rate-limit")
          await new Promise((resolve) => setTimeout(resolve, 1000))

          await resend.emails.send({
            from,
            to: body.email,
            subject,
            react: Welcome({ unsubscribeToken }),
          })
        }

        if (contact.error)
          return reply.code(400).send({
            success: false,
            message: "Unable to subscribe this email address",
          })

        return { success: true }
      } catch (err) {
        fastify.log.error(err)
        return reply
          .code(500)
          .send({ success: false, message: "Something went wrong" })
      }
    },
  })
}
