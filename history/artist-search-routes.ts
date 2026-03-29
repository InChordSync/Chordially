/**
 * Issue #92 – Implement search and filtering for artist discovery
 *
 * File destination: apps/api/src/modules/artists/artist.routes.ts
 *
 * Register in apps/api/src/modules/index.ts:
 *   import { artistRouter } from "./artists/artist.routes.js";
 *   app.use("/artists", artistRouter);
 *
 * Endpoints:
 *   GET /artists/search  – search and filter artist profiles (public)
 *
 * Query params:
 *   q       – free-text search on stageName and handle (case-insensitive)
 *   genre   – exact genre match (case-insensitive)
 *   city    – exact city match (case-insensitive)
 *   limit   – max results (default 20, max 100)
 *   offset  – pagination offset (default 0)
 *
 * Acceptance criteria covered:
 *  ✓ Users can search by artist name or handle
 *  ✓ Genre and city filters narrow results correctly
 *  ✓ Empty results and filter resets are supported
 *  ✓ Deactivated artists are excluded from public results
 */

import { Router } from "express";
import { searchArtists } from "./artist-search-store.js";

export const artistRouter = Router();

// ─── GET /artists/search ──────────────────────────────────────────────────────

artistRouter.get("/artists/search", (req, res) => {
  const { q, genre, city } = req.query as {
    q?: string;
    genre?: string;
    city?: string;
  };

  const rawLimit = parseInt(req.query.limit as string, 10);
  const rawOffset = parseInt(req.query.offset as string, 10);
  const limit = isNaN(rawLimit) ? 20 : Math.min(rawLimit, 100);
  const offset = isNaN(rawOffset) ? 0 : rawOffset;

  const result = searchArtists({ q, genre, city, limit, offset });

  res.json(result);
});
