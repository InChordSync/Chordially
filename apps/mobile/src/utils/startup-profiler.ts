interface ProfileMark {
  label: string;
  ms: number;
}

const marks: ProfileMark[] = [];
let startTime = 0;

export function startProfiling(): void {
  startTime = Date.now();
  marks.length = 0;
  console.log("[StartupProfiler] Profiling started");
}

export function mark(label: string): void {
  marks.push({ label, ms: Date.now() - startTime });
}

export function endProfiling(): void {
  mark("end");
  console.log("[StartupProfiler] Results:");
  let prev = 0;
  for (const m of marks) {
    console.log(`  ${m.label}: +${m.ms - prev}ms (total: ${m.ms}ms)`);
    prev = m.ms;
  }
}
