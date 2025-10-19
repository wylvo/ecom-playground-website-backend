import type { FastifyPluginCallback } from "fastify"
import fastifyPlugin from "fastify-plugin"

declare module "fastify" {
  interface FastifyInstance {
    makeImmutableSet: (iterable: any) => Set<unknown>
  }
}

const immutableSetPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.decorate("makeImmutableSet", (iterable) => {
    const originalSet = new Set(iterable)

    return new Proxy(originalSet, {
      get(target, prop, receiver) {
        const mutatingMethods = ["add", "delete", "clear"]

        if (mutatingMethods.includes(prop as any)) {
          throw new Error(`Cannot mutate immutable set using ${String(prop)}()`)
        }

        const value = Reflect.get(target, prop, receiver)
        return typeof value === "function" ? value.bind(target) : value
      },
      set() {
        throw new Error("Cannot modify immutable set")
      },
      deleteProperty() {
        throw new Error("Cannot delete properties from immutable set")
      },
    })
  })

  done()
}

export default fastifyPlugin(immutableSetPlugin, {
  name: "immutable-set",
})
