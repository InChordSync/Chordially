import { writeFileSync } from "fs";

interface SprintIssue {
  number: number;
  title: string;
  assignee: string;
  state: "open" | "closed";
}

interface SprintSnapshot {
  sprint: string;
  exportedAt: string;
  issues: SprintIssue[];
}

function toMarkdown(snapshot: SprintSnapshot): string {
  const lines = [
    `# Sprint Snapshot — ${snapshot.sprint}`,
    `_Exported: ${snapshot.exportedAt}_`,
    "",
    "| # | Title | Assignee | State |",
    "|---|-------|----------|-------|",
  ];
  for (const issue of snapshot.issues) {
    lines.push(`| ${issue.number} | ${issue.title} | @${issue.assignee} | ${issue.state} |`);
  }
  return lines.join("\n");
}

export function writeSprintSnapshot(snapshot: SprintSnapshot, outputPath: string): void {
  const md = toMarkdown(snapshot);
  writeFileSync(outputPath, md, "utf-8");
  console.log(`Snapshot written → ${outputPath}`);
}
