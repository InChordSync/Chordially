import { Test } from "@nestjs/testing"
import type { INestApplication } from "@nestjs/common"
import type { NextFunction, Request, Response } from "express"
import request from "supertest"
import { expect } from "vitest"
import { AppModule } from "../../src/app.module.js"
import { requireAuth } from "../../src/shared/middleware/auth.middleware.js"

/** Boots the real Nest app with the same /api prefix and auth gates as main.ts. */
export async function createE2eApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
  const app = moduleRef.createNestApplication()
  app.setGlobalPrefix("api")

  // The standalone Express error middleware that translates AppError lives in
  // the missing src/app.ts bootstrap; reproduce its response shape here so
  // the auth gate's 401 is observable over HTTP.
  const guardedRequireAuth = (req: Request, res: Response, next: NextFunction): void => {
    try {
      requireAuth(req, res, next)
    } catch (error: unknown) {
      const appError = error as { statusCode?: number; code?: string; message?: string }
      res.status(appError?.statusCode ?? 500).json({
        error: {
          code: appError?.code ?? "INTERNAL_ERROR",
          message: appError?.message ?? "Error",
        },
      })
    }
  }
  app.use("/api/users", guardedRequireAuth)
  app.use("/api/wallet", guardedRequireAuth)
  await app.init()
  return app
}

export async function registerAndLogin(app: INestApplication, email: string): Promise<string> {
  const registered = await request(app.getHttpServer())
    .post("/api/auth/register")
    .send({ email, password: "Password1!" })
  expect(registered.status).toBe(201)

  const loggedIn = await request(app.getHttpServer())
    .post("/api/auth/login")
    .send({ email, password: "Password1!" })
  expect(loggedIn.status).toBe(200)
  return loggedIn.body.token as string
}
