import express, { type Express } from "express";
import { WALLET_AUTH_TELEMETRY_EVENTS } from "@chordially/types";
import { Networks } from "stellar-sdk";

import { env } from "./env.js";
import { emitWalletAuthTelemetry } from "./telemetry.js";

const networkPassphrase =
  env.STELLAR_NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;

export function createApp(): Express {
  const app = express();

  app.get("/health", (_request, response) => {
    response.json({
      ok: true,
      service: "stellar-service",
      network: env.STELLAR_NETWORK
    });
  });

  app.get("/api/v1/stellar/network", (_request, response) => {
    response.json({
      network: env.STELLAR_NETWORK,
      horizonUrl: env.HORIZON_URL,
      passphrase: networkPassphrase
    });
  });

  app.get("/api/v1/stellar/starter-intent", (_request, response) => {
    emitWalletAuthTelemetry({
      event: WALLET_AUTH_TELEMETRY_EVENTS.walletLinkStarted,
      outcome: "start",
      boundary: "stellar.starter_intent",
      network: env.STELLAR_NETWORK,
    });
    response.json({
      asset: "USDC",
      useCase: "hackathon-mvp",
      nextStep: "Implement authenticated wallet and payment flows."
    });
  });

  return app;
}
