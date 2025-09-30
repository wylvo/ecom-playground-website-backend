import { countries, regions, taxRates } from "@/db/schema"
import { eq } from "drizzle-orm"
import { CheckoutBodySchema } from "@/routes/checkout"
import type { FastifyRequest, FastifyReply, FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"
import { TaxRates } from "@/types/tax-rates"

// Extend Fastify types
declare module "fastify" {
  interface FastifyInstance {
    verifyCheckoutTaxRates: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>
  }
  interface FastifyRequest {
    taxRates?: TaxRates
  }
}

const checkoutTaxRatesPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate(
    "verifyCheckoutTaxRates",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = request.body as CheckoutBodySchema

        const countryTaxRates = await fastify.db
          .select({
            id: taxRates.id,
            rate: taxRates.rate,
            taxName: taxRates.taxName,
            isInclusive: taxRates.isInclusive,
            country: {
              id: countries.id,
              code: countries.code,
              name: countries.name,
            },
            region: {
              id: regions.id,
              code: regions.code,
              name: regions.name,
            },
          })
          .from(taxRates)
          .innerJoin(countries, eq(taxRates.countryId, countries.id))
          .leftJoin(regions, eq(taxRates.regionId, regions.id))
          .where(eq(countries.name, body.shipping_country_name))

        if (!countryTaxRates?.length)
          return reply.code(404).send({
            success: false,
            message: "Tax rates not found",
          })

        request.taxRates = countryTaxRates
      } catch (err) {
        fastify.log.error(err)
        return reply.code(500).send({
          success: false,
          error: "Something went wrong verifying tax rates",
        })
      }
    },
  )
}

export default fastifyPlugin(checkoutTaxRatesPlugin, {
  name: "checkout-tax-rates",
})
