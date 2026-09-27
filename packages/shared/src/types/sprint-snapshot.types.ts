export interface BacklogItemSummary {
  issueNumber: number;
  title: string;
  assignee?: string;
  complexity: 'simple' | 'intermediate' | 'complex';
  status: 'open' | 'closed' | 'in_progress';
}

export interface SprintSnapshotMeta {
  sprintName: string;
  sprintNumber: number;
  exportedAt: string;
  totalIssuesCount: number;
}

export interface SnapshotExportOptions {
  includeClosedIssues: boolean;
  groupByAssignee: boolean;
  outputFormat: 'markdown' | 'json';
}
