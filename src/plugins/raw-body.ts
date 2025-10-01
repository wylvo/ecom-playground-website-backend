import type { FastifyPluginAsync } from "fastify"
import fastifyPlugin from "fastify-plugin"
import rawBody from "fastify-raw-body"

const rawBodyPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.register(rawBody, {
    field: "rawBody", // change the default request.rawBody property name
    global: false, // add the rawBody to every request. **Default true**
    encoding: "utf8", // set it to false to set rawBody as a Buffer **Default utf8**
    runFirst: true, // get the body before any preParsing hook change/uncompress it. **Default false**
    routes: [], // array of routes, **`global`** will be ignored, wildcard routes not supported
    jsonContentTypes: [], // array of content-types to handle as JSON. **Default ['application/json']**
  })
}

export default fastifyPlugin(rawBodyPlugin, { name: "raw-body" })
