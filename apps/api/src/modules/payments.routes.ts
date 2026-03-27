import { Router } from "express";
import { z } from "zod";
import type { StellarService } from "../services/stellar/stellar.types.js";

const prepareSchema = z.object({
  amount: z.string().min(1),
  asset: z.enum(["XLM", "USDC"]),
  destination: z.string().min(10)
});

export function createPaymentsRouter(stellarService: StellarService) {
  const router = Router();

  router.post("/prepare", (req, res) => {
    const parsed = prepareSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid payment request",
        details: parsed.error.flatten()
      });
      return;
    }

    const intent = stellarService.prepareTipIntent(parsed.data);

    res.status(200).json(intent);
  });

  return router;
}
