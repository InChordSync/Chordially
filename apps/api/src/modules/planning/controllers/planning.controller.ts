import type { NextFunction, Request, Response } from "express"
import { z } from "zod"
import { backlogItemSummarySchema, snapshotExportOptionsSchema } from "@chordially/shared"
import { sprintSnapshotWriterService } from "../services/sprint-snapshot-writer.service.js"

const sprintSnapshotRequestSchema = z.object({
  sprintName: z.string().min(1).default("Current Sprint"),
  items: z.array(backlogItemSummarySchema).min(0).default([]),
  options: snapshotExportOptionsSchema.partial().optional(),
})

export const planningController = {
  // Exposes the (previously dead) sprint snapshot export over HTTP so an
  // authenticated admin can trigger or download a markdown/JSON snapshot.
  async exportSprintSnapshot(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const input = sprintSnapshotRequestSchema.parse(req.body)

      const markdown = sprintSnapshotWriterService.generateMarkdownSnapshot(
        input.sprintName,
        input.items,
        input.options
      )

      const format = (input.options?.outputFormat ?? "markdown")
      if (format === "json") {
        res.status(200).json({ sprintName: input.sprintName, markdown })
        return
      }

      res
        .status(200)
        .setHeader("Content-Type", "text/markdown; charset=utf-8")
        .setHeader("Content-Disposition", `attachment; filename="sprint-snapshot.md"`)
        .send(markdown)
    } catch (error) {
      next(error)
    }
  },
}
