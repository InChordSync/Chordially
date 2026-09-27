import { Router, type Request } from "express"
import { openapiSpec } from "./openapi.js"

export const openapiRouter: Router = Router()

openapiRouter.get("/openapi.json", (_req: Request, res) => {
  res.status(200).json(openapiSpec)
})

openapiRouter.get("/", (_req: Request, res) => {
  const paths = Object.keys(openapiSpec.paths)
  res.status(200).json({
    api: "Chordially API",
    openapi: `${openapiSpec.openapi}`,
    spec: "/api/docs/openapi.json",
    paths,
  })
})
