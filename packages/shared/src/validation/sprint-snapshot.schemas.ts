import { z } from 'zod';

export const backlogItemSummarySchema = z.object({
  issueNumber: z.number().int().positive(),
  title: z.string().min(1, 'Title is required.'),
  assignee: z.string().optional(),
  complexity: z.enum(['simple', 'intermediate', 'complex']),
  status: z.enum(['open', 'closed', 'in_progress']),
});

export const snapshotExportOptionsSchema = z.object({
  includeClosedIssues: z.boolean().default(true),
  groupByAssignee: z.boolean().default(false),
  outputFormat: z.enum(['markdown', 'json']).default('markdown'),
});

export type BacklogItemSummaryInput = z.infer<typeof backlogItemSummarySchema>;
export type SnapshotExportOptionsInput = z.infer<typeof snapshotExportOptionsSchema>;
