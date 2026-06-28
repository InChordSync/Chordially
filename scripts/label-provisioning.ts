interface Label {
  name: string;
  color: string;
  description?: string;
}

const sprintLabels: Label[] = [
  { name: "sprint:current", color: "0075ca", description: "Active sprint issues" },
  { name: "sprint:next", color: "e4e669", description: "Planned for next sprint" },
  { name: "sprint:backlog", color: "cfd3d7", description: "In the backlog" },
  { name: "priority:high", color: "d93f0b", description: "High priority" },
  { name: "priority:low", color: "bfd4f2", description: "Low priority" },
];

function provisionLabels(labels: Label[]): void {
  console.log("Provisioning sprint labels:\n");
  for (const label of labels) {
    const desc = label.description ? ` — ${label.description}` : "";
    console.log(`  • [#${label.color}] ${label.name}${desc}`);
  }
  console.log(`\n${labels.length} label(s) ready to publish.`);
}

export { sprintLabels, provisionLabels };
provisionLabels(sprintLabels);
