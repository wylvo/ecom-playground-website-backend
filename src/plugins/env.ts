import type { FastifyPluginCallback } from "fastify"
import type { FastifyEnvOptions } from "@fastify/env"
import fastifyEnv from "@fastify/env"
import fastifyPlugin from "fastify-plugin"

import dotenv from "dotenv"
import dotenvExpand from "dotenv-expand"
dotenvExpand.expand(dotenv.config({ quiet: true }))

declare module "fastify" {
  interface FastifyInstance {
    env: {
      HOST: string
      PORT: number
      SUPABASE_URL: string
      SUPABASE_JWT_ISSUER: string
      SUPABASE_JWK_REMOTE_ENDPOINT: string
      SUPABASE_DATABASE_URL: string
      RESEND_API_KEY: string
      RESEND_AUDIENCE_ID: string
      CLOUDFLARE_TURNSTILE_SITE_KEY: string
      CLOUDFLARE_TURNSTILE_SECRET_KEY: string
      CLOUDFLARE_TURNSTILE_SITE_VERIFY_ENDPOINT: string
      ALLOWED_ORIGINS: string[]
    }
  }
}

const envPlugin: FastifyPluginCallback = (fastify, _options, done) => {
  const schema = {
    type: "object",
    required: [
      "PORT",
      "SUPABASE_URL",
      "RESEND_API_KEY",
      "RESEND_AUDIENCE_ID",
      "CLOUDFLARE_TURNSTILE_SITE_KEY",
      "CLOUDFLARE_TURNSTILE_SECRET_KEY",
      "CLOUDFLARE_TURNSTILE_SITE_VERIFY_ENDPOINT",
    ],
    properties: {
      HOST: {
        type: "string",
        default: "0.0.0.0",
      },
      PORT: {
        type: "number",
        default: 3000,
      },
      SUPABASE_URL: {
        type: "string",
      },
      SUPABASE_JWT_ISSUER: {
        type: "string",
      },
      SUPABASE_JWK_REMOTE_ENDPOINT: {
        type: "string",
      },
      SUPABASE_DATABASE_URL: {
        type: "string",
      },
      RESEND_API_KEY: {
        type: "string",
      },
      RESEND_AUDIENCE_ID: {
        type: "string",
      },
      CLOUDFLARE_TURNSTILE_SITE_KEY: {
        type: "string",
      },
      CLOUDFLARE_TURNSTILE_SECRET_KEY: {
        type: "string",
      },
      CLOUDFLARE_TURNSTILE_SITE_VERIFY_ENDPOINT: {
        type: "string",
      },
      ALLOWED_ORIGINS: {
        type: "string",
        separator: ",",
        default: "http://localhost:5173",
      },
    },
  }

  const options: FastifyEnvOptions = {
    // decorate the Fastify server instance with `env` key
    // such as `fastify.env('PORT')
    confKey: "env",

    // schema to validate
    schema: schema,

    // source for the configuration data
    data: process.env,

    // will read .env in root folder
    dotenv: true,

    // will remove the additional properties
    // from the data object which creates an
    // explicit schema
    // removeAdditional: true,
  }

  fastifyEnv(fastify, options, done)
}

export default fastifyPlugin(envPlugin, { name: "env" })
