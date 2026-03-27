import express from "express";
import { healthRouter } from "./modules/health.routes.js";
import { createPaymentsRouter } from "./modules/payments.routes.js";
import { FakeStellarService } from "./services/stellar/fake-stellar.service.js";
import type { StellarService } from "./services/stellar/stellar.types.js";

export function createApp(stellarService: StellarService = new FakeStellarService()) {
  const app = express();

  app.use(express.json());
  app.use("/health", healthRouter);
  app.use("/payments", createPaymentsRouter(stellarService));

  return app;
}
