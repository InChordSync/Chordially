import { describe, expect, it } from "vitest"
import { SprintSnapshotWriterService } from "../services/sprint-snapshot-writer.service.js"
import type { BacklogItemSummary } from "@chordially/shared"

const items: BacklogItemSummary[] = [
  { issueNumber: 101, title: "Add pagination", assignee: "alice", complexity: "intermediate", status: "open" },
  { issueNumber: 102, title: "Fix login bug", assignee: "bob", complexity: "simple", status: "closed" },
  { issueNumber: 103, title: "Reconcile tips", assignee: "alice", complexity: "complex", status: "in_progress" },
]

describe("SprintSnapshotWriterService", () => {
  const service = new SprintSnapshotWriterService()

  it("renders a markdown snapshot with open items by default", () => {
    const markdown = service.generateMarkdownSnapshot("Sprint 12", items)
    expect(markdown).toContain("# Sprint Snapshot: Sprint 12")
    expect(markdown).toContain("#101")
    // includeClosedIssues defaults to true, so closed items are present.
    expect(markdown).toContain("#102")
  })

  it("filters out closed issues when includeClosedIssues is false", () => {
    const markdown = service.generateMarkdownSnapshot("Sprint 12", items, {
      includeClosedIssues: false,
    })
    expect(markdown).toContain("#101")
    expect(markdown).not.toContain("#102")
  })

  it("labels unassigned issues as Unassigned", () => {
    const withUnassigned: BacklogItemSummary[] = [
      { issueNumber: 5, title: "No owner", complexity: "simple", status: "open" },
    ]
    const markdown = service.generateMarkdownSnapshot("Sprint 12", withUnassigned)
    expect(markdown).toContain("| Unassigned |")
  })
})
