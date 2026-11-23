import "reflect-metadata";
import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "./app.module.js";
import { errorHandler } from "./shared/errors/error-handler.middleware.js";

type HttpMethod = "get" | "post" | "patch" | "delete";

const protectedRoutes: Array<{ method: HttpMethod; path: string }> = [
  { method: "get", path: "/api/users/me" },
  { method: "get", path: "/api/users/me/completeness" },
  { method: "post", path: "/api/users/me/avatar-upload-url" },
  { method: "get", path: "/api/users/me/avatar-signed-url" },
  { method: "patch", path: "/api/users/me" },
  { method: "post", path: "/api/creators" },
  { method: "patch", path: "/api/creators/test-creator" },
  { method: "get", path: "/api/creator-payouts" },
  { method: "get", path: "/api/creator-payouts/audit-log" },
  { method: "get", path: "/api/creator-payouts/test-payout" },
  { method: "post", path: "/api/creator-payouts" },
  { method: "post", path: "/api/creator-payouts/eligibility" },
  { method: "post", path: "/api/creator-payouts/interactive-withdrawal" },
  { method: "get", path: "/api/deposits" },
  { method: "get", path: "/api/deposits/status-poll" },
  { method: "get", path: "/api/deposits/status-poll/test-deposit" },
  { method: "post", path: "/api/deposits/interactive" },
  { method: "get", path: "/api/wallet" },
  { method: "get", path: "/api/wallet/me" },
  { method: "post", path: "/api/wallet/link-challenge" },
  { method: "post", path: "/api/wallet/link-verify" },
  { method: "post", path: "/api/wallet/usdc-trustline" },
  { method: "delete", path: "/api/wallet/test-wallet" },
  { method: "patch", path: "/api/wallet/test-wallet/primary" },
  { method: "post", path: "/api/wallet/integrate-stellar" },
  { method: "post", path: "/api/wallet/deposits" },
  { method: "get", path: "/api/wallet/deposits" },
  { method: "post", path: "/api/streams" },
  { method: "post", path: "/api/streams/test-stream/end" },
  { method: "post", path: "/api/tips" },
  { method: "get", path: "/api/notifications" },
  { method: "patch", path: "/api/notifications/read-all" },
  { method: "patch", path: "/api/notifications/test-notification/read" },
  { method: "get", path: "/api/notifications/email-provider" },
  { method: "get", path: "/api/search/creators" },
  { method: "get", path: "/api/search/browse" },
  { method: "get", path: "/api/admin/audit-log" },
  { method: "patch", path: "/api/admin/creators/test-creator/verify" },
  { method: "patch", path: "/api/admin/users/test-user/suspend" },
  { method: "patch", path: "/api/admin/payouts/test-payout/override" },
  { method: "get", path: "/api/admin/dashboard-summary" },
];

function createApiApp(): Promise<INestApplication> {
  return NestFactory.create(AppModule, { logger: false }).then(async (app) => {
    app.setGlobalPrefix("api");
    await app.init();
    app.use(errorHandler);
    return app;
  });
}

function send(app: INestApplication, method: HttpMethod, path: string) {
  const client = request(app.getHttpServer());
  switch (method) {
    case "get":
      return client.get(path);
    case "post":
      return client.post(path);
    case "patch":
      return client.patch(path);
    case "delete":
      return client.delete(path);
  }
}

describe("Nest API authentication e2e", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApiApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("allows the documented public endpoints", async () => {
    await request(app.getHttpServer()).get("/api/health/live").expect(200);
    await request(app.getHttpServer()).post("/api/auth/register").send({}).expect(400);
    await request(app.getHttpServer()).post("/api/auth/login").send({}).expect(400);
    await request(app.getHttpServer()).get("/api/creators/not-a-real-slug").expect(404);
    await request(app.getHttpServer()).post("/api/deposits/webhook").expect(401);
    await request(app.getHttpServer()).post("/api/creator-payouts/webhook").expect(401);
  });

  it("rejects unauthenticated requests on every protected route", async () => {
    for (const { method, path } of protectedRoutes) {
      const response = await send(app, method, path);
      expect(response.status, `${method.toUpperCase()} ${path}`).toBe(401);
      expect(response.body.error.code, `${method.toUpperCase()} ${path}`).toBe("UNAUTHORIZED");
    }
  });
});

describe("Nest API global throttle e2e", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApiApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 429 for the 101st request in the configured 60-second window", async () => {
    for (let requestNumber = 1; requestNumber <= 100; requestNumber += 1) {
      await request(app.getHttpServer()).get("/api/health/live").expect(200);
    }

    await request(app.getHttpServer()).get("/api/health/live").expect(429);
  });
});
