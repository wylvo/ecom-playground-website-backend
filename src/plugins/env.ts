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
      NODE_ENV: "development" | "production"
      HOST: string
      PORT: number
      FRONTEND_ENDPOINT: string
      SUPABASE_URL: string
      SUPABASE_JWT_ISSUER: string
      SUPABASE_JWK_REMOTE_ENDPOINT: string
      SUPABASE_DATABASE_URL: string
      SUPABASE_DATABASE_MIGRATIONS_URL: string
      STRIPE_LIVE_SECRET_KEY: string
      STRIPE_LIVE_WEBHOOK_SECRET: string
      STRIPE_TEST_SECRET_KEY: string
      STRIPE_TEST_WEBHOOK_SECRET: string
      STRIPE_API_VERSION: string
      RESEND_API_KEY: string
      RESEND_AUDIENCE_ID: string
      CLOUDFLARE_TURNSTILE_SITE_KEY: string
      CLOUDFLARE_TURNSTILE_SECRET_KEY: string
      CLOUDFLARE_TURNSTILE_SITE_VERIFY_ENDPOINT: string
      ALLOW_ORIGINS: string[]
      ALLOW_HEADERS: string[]
      ALLOW_METHODS: string[]
      ALLOW_CREDENTIALS: boolean
      EMAIL_BRAND_DOMAIN: string
      EMAIL_UNSUBSCRIBE_URL: string
      EMAIL_UNSUBSCRIBE_JWT_SECRET_KEY: string
      EMAIL_UNSUBSCRIBE_JWT_EXPIRATION_TIME: string
      WELCOME_EMAIL_FROM: string
      WELCOME_EMAIL_SUBJECT: string
      WELCOME_EMAIL_PREVIEW: string
    }
  }
}

const envPlugin: FastifyPluginCallback = (fastify, _options, done) => {
  const schema = {
    type: "object",
    required: [
      "NODE_ENV",
      "HOST",
      "PORT",
      "FRONTEND_ENDPOINT",
      "SUPABASE_URL",
      "STRIPE_LIVE_SECRET_KEY",
      "STRIPE_LIVE_WEBHOOK_SECRET",
      "STRIPE_TEST_SECRET_KEY",
      "STRIPE_TEST_WEBHOOK_SECRET",
      "STRIPE_API_VERSION",
      "RESEND_API_KEY",
      "RESEND_AUDIENCE_ID",
      "CLOUDFLARE_TURNSTILE_SITE_KEY",
      "CLOUDFLARE_TURNSTILE_SECRET_KEY",
      "CLOUDFLARE_TURNSTILE_SITE_VERIFY_ENDPOINT",
      "EMAIL_BRAND_DOMAIN",
      "EMAIL_UNSUBSCRIBE_URL",
      "EMAIL_UNSUBSCRIBE_JWT_SECRET_KEY",
      "EMAIL_UNSUBSCRIBE_JWT_EXPIRATION_TIME",
    ],
    properties: {
      NODE_ENV: {
        type: "string",
      },
      HOST: {
        type: "string",
        default: "0.0.0.0",
      },
      PORT: {
        type: "number",
        default: 3000,
      },
      FRONTEND_ENDPOINT: {
        type: "string",
        default: "http://localhost:5173",
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
      SUPABASE_DATABASE_MIGRATIONS_URL: {
        type: "string",
      },
      STRIPE_LIVE_SECRET_KEY: {
        type: "string",
      },
      STRIPE_LIVE_WEBHOOK_SECRET: {
        type: "string",
      },
      STRIPE_TEST_SECRET_KEY: {
        type: "string",
      },
      STRIPE_TEST_WEBHOOK_SECRET: {
        type: "string",
      },
      STRIPE_API_VERSION: {
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
      ALLOW_ORIGINS: {
        type: "string",
        separator: ",",
        default: "*",
      },
      ALLOW_HEADERS: {
        type: "string",
        separator: ",",
        default: "Content-Type,Authorization,Set-Cookie",
      },
      ALLOW_METHODS: {
        type: "string",
        separator: ",",
        default: "GET,PATCH,PUT,DELETE,OPTIONS",
      },
      ALLOW_CREDENTIALS: {
        type: "boolean",
        default: true,
      },
      EMAIL_BRAND_DOMAIN: {
        type: "string",
      },
      EMAIL_UNSUBSCRIBE_URL: {
        type: "string",
      },
      EMAIL_UNSUBSCRIBE_JWT_SECRET_KEY: {
        type: "string",
      },
      EMAIL_UNSUBSCRIBE_JWT_EXPIRATION_TIME: {
        type: "string",
      },
      WELCOME_EMAIL_FROM: {
        type: "string",
      },
      WELCOME_EMAIL_SUBJECT: {
        type: "string",
        default: "Welcome",
      },
      WELCOME_EMAIL_PREVIEW: {
        type: "string",
        default: "Welcome",
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
