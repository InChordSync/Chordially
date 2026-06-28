export interface SeedUser {
  id: string;
  role: "creator" | "fan";
  email: string;
  name: string;
}

export interface SeedWallet {
  userId: string;
  balance: number;
  currency: string;
}

export const seedUsers: SeedUser[] = [
  { id: "creator-1", role: "creator", email: "creator@dev.local", name: "Dev Creator" },
  { id: "fan-1", role: "fan", email: "fan@dev.local", name: "Dev Fan" },
  { id: "fan-2", role: "fan", email: "fan2@dev.local", name: "Dev Fan 2" },
];

export const seedWallets: SeedWallet[] = [
  { userId: "creator-1", balance: 1000, currency: "XLM" },
  { userId: "fan-1", balance: 500, currency: "XLM" },
  { userId: "fan-2", balance: 250, currency: "XLM" },
];

export function printSeed(): void {
  console.log("Seed users:", seedUsers.map((u) => `${u.role}:${u.email}`).join(", "));
  console.log("Seed wallets:", seedWallets.map((w) => `${w.userId}:${w.balance}${w.currency}`).join(", "));
}
