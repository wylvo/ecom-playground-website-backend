import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js"
import * as schema from "@/db/schema"
import postgres from "postgres"
import fastifyPlugin from "fastify-plugin"
import type { FastifyPluginAsync } from "fastify"

declare module "fastify" {
  interface FastifyInstance {
    db: PostgresJsDatabase<typeof schema>
  }
}

const databasePlugin: FastifyPluginAsync = async (fastify) => {
  const connectionString = fastify.env.SUPABASE_DATABASE_URL

  if (!connectionString) {
    fastify.log.error("Missing SUPABASE_DATABASE_URL in environment variables")
    throw new Error("Database connection URL not found")
  }

  try {
    const client = postgres(connectionString, { prepare: false })
    const db = drizzle(client, { casing: "snake_case", schema })

    // Test connection
    await db.execute("SELECT 1")

    fastify.decorate("db", db)

    fastify.log.info("Database connection established successfully")

    fastify.addHook("onClose", async () => {
      await db.$client.end()
    })
  } catch (err) {
    fastify.log.error("Failed to connect to database")
    throw err
  }
}

export default fastifyPlugin(databasePlugin, {
  name: "database",
  dependencies: ["env"],
})
