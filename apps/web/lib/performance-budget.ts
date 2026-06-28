export interface RouteBudget {
  route: string;
  maxFCP: number;
  maxLCP: number;
  maxTTI: number;
  maxBundleKB: number;
}

export const performanceBudgets: RouteBudget[] = [
  { route: "/", maxFCP: 1500, maxLCP: 2500, maxTTI: 3500, maxBundleKB: 150 },
  { route: "/login", maxFCP: 1000, maxLCP: 2000, maxTTI: 2500, maxBundleKB: 100 },
  { route: "/profile", maxFCP: 1500, maxLCP: 3000, maxTTI: 4000, maxBundleKB: 200 },
  { route: "/discover", maxFCP: 2000, maxLCP: 3500, maxTTI: 5000, maxBundleKB: 250 },
  { route: "/creators/[id]", maxFCP: 1500, maxLCP: 3000, maxTTI: 4500, maxBundleKB: 220 },
];

export function checkBudget(route: string, actual: Omit<RouteBudget, "route">): string[] {
  const budget = performanceBudgets.find((b) => b.route === route);
  if (!budget) return [];
  return (Object.keys(actual) as Array<keyof typeof actual>)
    .filter((k) => actual[k] > budget[k])
    .map((k) => `${k}: ${actual[k]} exceeds budget of ${budget[k]}`);
}
