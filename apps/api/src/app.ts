import express from "express";
import { auditMiddleware } from "./audit-middleware.js";
import { listAuditEvents } from "./audit-store.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(auditMiddleware);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.post("/profile", (req, res) => {
    res.status(201).json({
      id: "profile-demo",
      ...req.body
    });
  });

  app.patch("/profile/:id", (req, res) => {
    res.status(200).json({
      id: req.params.id,
      ...req.body
    });
  });

  app.get("/audit", (_req, res) => {
    res.status(200).json({
      items: listAuditEvents()
    });
  });

  return app;
}
