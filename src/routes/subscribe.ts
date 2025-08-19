import { type FastifyInstance } from "fastify"
import { Resend } from "resend"
import domains from "disposable-domains" with { type: "json" }
import wildcards from "disposable-domains/wildcard.json" with { type: "json" }
import z from "zod"
import type { ZodTypeProvider } from "fastify-type-provider-zod"

export const autoPrefix = "/newsletter"

const turnstileSecretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY
const turnstileSiteVerify = process.env
  .CLOUDFLARE_TURNSTILE_SITE_VERIFY_ENDPOINT as string
const blockedDomains = new Set([...domains, ...wildcards])

type SubscribeBody = z.infer<typeof subscribeBodySchema>

type TurnstileResult = {
  success: boolean
  challenge_ts: string
  hostname: string
  "error-codes": Array<string>
  action: string
  cdata: string
}

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

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/subscribe",
    schema: {
      body: subscribeBodySchema,
    },

    handler: async (req, reply) => {
      const body = req.body as SubscribeBody
      let contact

      try {
        // Cloudflare Turnstile
        const response = await fetch(turnstileSiteVerify, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            secret: turnstileSecretKey,
            response: body.token,
          }),
        })

        if (!response.ok)
          return reply.code(400).send({
            message: "Unable to verify token. Please try again later",
          })

        const result = (await response.json()) as TurnstileResult

        if (result.success === false)
          return reply.code(401).send({
            message: "Unauthorized",
          })

        // Resend
        const existingContact = await resend.contacts.get({
          email: body.email,
          audienceId,
        })

        if (existingContact.data)
          if (existingContact.data.unsubscribed === false)
            return { success: true }
          else
            contact = await resend.contacts.update({
              email: existingContact.data?.email || body.email,
              ...(body.firstName && { firstName: body.firstName }),
              unsubscribed: false,
              audienceId,
            })
        else
          contact = await resend.contacts.create({
            email: body.email,
            firstName: body.firstName || "",
            unsubscribed: false,
            audienceId,
          })

        if (contact.error)
          return reply
            .code(400)
            .send({ message: "Unable to subscribe this email address" })

        return { success: true }
      } catch (err) {
        fastify.log.error(err)
        return reply.code(500).send({ message: "Something went wrong" })
      }
    },
  })
}
