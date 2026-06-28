interface BacklogItem {
  number: number;
  title: string;
}

function findDuplicates(items: BacklogItem[]): BacklogItem[][] {
  const seen = new Map<number, BacklogItem[]>();
  for (const item of items) {
    const group = seen.get(item.number) ?? [];
    group.push(item);
    seen.set(item.number, group);
  }
  return Array.from(seen.values()).filter((group) => group.length > 1);
}

export function validateBacklog(items: BacklogItem[]): boolean {
  const duplicates = findDuplicates(items);
  if (!duplicates.length) {
    console.log("Backlog validation passed — no duplicate numbers found.");
    return true;
  }
  console.error("Duplicate issue numbers detected:");
  for (const group of duplicates) {
    console.error(`  #${group[0].number}: ${group.map((i) => `"${i.title}"`).join(", ")}`);
  }
  return false;
}
