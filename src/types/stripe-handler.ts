import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import Stripe from "stripe"

export type StripeHandler = {
  fastify: FastifyInstance
  request?: FastifyRequest
  reply?: FastifyReply
  event: Stripe.Event
}
