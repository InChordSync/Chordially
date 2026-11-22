import {
  type BacklogItemSummary,
  type SnapshotExportOptionsInput,
  snapshotExportOptionsSchema,
} from '@chordially/shared';

export class SprintSnapshotWriterService {
  public generateMarkdownSnapshot(
    sprintName: string,
    items: BacklogItemSummary[],
    options?: Partial<SnapshotExportOptionsInput>
  ): string {
    const config = snapshotExportOptionsSchema.parse(options ?? {});
    const filtered = config.includeClosedIssues ? items : items.filter((i) => i.status !== 'closed');

    let markdown = `# Sprint Snapshot: ${sprintName}\n\n`;
    markdown += `*Exported on: ${new Date().toISOString()}*\n\n`;
    markdown += `| Issue # | Title | Assignee | Complexity | Status |\n`;
    markdown += `|---------|-------|----------|------------|--------|\n`;

    filtered.forEach((item) => {
      markdown += `| #${item.issueNumber} | ${item.title} | ${item.assignee ?? 'Unassigned'} | ${item.complexity} | ${item.status} |\n`;
    });

    return markdown;
  }
}

export const sprintSnapshotWriterService = new SprintSnapshotWriterService();
