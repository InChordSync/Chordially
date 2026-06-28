interface IssuePayload {
  title: string;
  body: string;
  labels: string[];
  assignees: string[];
}

const plannedIssues: IssuePayload[] = [
  {
    title: "Example issue title",
    body: "Example issue body with details.",
    labels: ["enhancement"],
    assignees: ["some-user"],
  },
];

function dryRunPublish(issues: IssuePayload[]): void {
  console.log("=== DRY RUN: Planned issue payloads ===\n");
  issues.forEach((issue, i) => {
    console.log(`[${i + 1}] ${issue.title}`);
    console.log(`     Labels: ${issue.labels.join(", ")}`);
    console.log(`     Assignees: ${issue.assignees.join(", ")}`);
    console.log(`     Body preview: ${issue.body.slice(0, 80)}`);
    console.log();
  });
  console.log(`Total planned: ${issues.length} issue(s). No changes made.`);
}

dryRunPublish(plannedIssues);
