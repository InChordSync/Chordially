# Markdown Sprint Snapshot Writer Specification

This document details the markdown table formatting specifications, options schemas, and export UI components for local sprint planning in Chordially.

## Architecture

1. **Snapshot Writer Service**:
   - `apps/api/src/modules/planning/services/sprint-snapshot-writer.service.ts`: `SprintSnapshotWriterService` formatting backlog items into GitHub markdown tables.

2. **Web UI Export Trigger**:
   - `SprintSnapshotExportButton`: React component initiating local markdown file downloads.

3. **Validation Schemas & Interfaces**:
   - `snapshotExportOptionsSchema` and `BacklogItemSummary` defined in `@chordially/shared`.
