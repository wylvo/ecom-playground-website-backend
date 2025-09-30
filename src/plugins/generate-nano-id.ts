import fastifyPlugin from "fastify-plugin"
import type { FastifyPluginCallback } from "fastify"
import { customAlphabet } from "nanoid"

declare module "fastify" {
  interface FastifyInstance {
    generateOrderNumber: () => string
  }
}

const generateOrderNumberPlugin: FastifyPluginCallback = (
  fastify,
  _options,
  done,
) => {
  const now = new Date()
  const year = now.getFullYear().toString()
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ]
  const month = months[now.getMonth()]
  const day = String(now.getDate()).padStart(2, "0")
  const prefix = "B"

  // const alphabetSet = "6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz"
  const alphabetSet = "6789BCDFGHJKLMNPQRTW"
  const nanoid = customAlphabet(alphabetSet, 10)

  const orderNumber = () => `${prefix}-${nanoid()}-${year}${month}${day}`

  fastify.decorate("generateOrderNumber", () => orderNumber())

  done()
}

export default fastifyPlugin(generateOrderNumberPlugin, {
  name: "generate-order-number",
})
