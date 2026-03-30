export const metadata = {
  title: "My Rewards | Chordially",
  description: "View your backstage passes and fan rewards"
};

type RewardTier = "bronze" | "silver" | "gold" | "backstage";

interface RewardItem {
  id: string;
  tier: RewardTier;
  label: string;
  artistName: string;
  issuedAt: string;
  expiresAt: string;
}

function getSeedRewards(): RewardItem[] {
  return [
    {
      id: "rwd-001",
      tier: "backstage",
      label: "Backstage Pass",
      artistName: "Nova Chords",
      issuedAt: "2026-03-10",
      expiresAt: "2026-06-10"
    },
    {
      id: "rwd-002",
      tier: "gold",
      label: "Gold Backer",
      artistName: "Bass Theory",
      issuedAt: "2026-03-18",
      expiresAt: "2026-06-18"
    },
    {
      id: "rwd-003",
      tier: "silver",
      label: "Silver Supporter",
      artistName: "Echo Drift",
      issuedAt: "2026-03-25",
      expiresAt: "2026-06-25"
    }
  ];
}

const tierBadgeStyle: Record<RewardTier, string> = {
  backstage: "chip chip--gold",
  gold: "chip chip--gold",
  silver: "chip",
  bronze: "chip"
};

export default function RewardsPage() {
  const rewards = getSeedRewards();

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>My rewards</h1>
      <p className="muted" style={{ marginBottom: "1.5rem" }}>
        Backstage passes and fan badges you have earned by supporting artists.
      </p>

      {rewards.length === 0 ? (
        <p className="muted">You have not earned any rewards yet. Start tipping artists to unlock badges!</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {rewards.map((reward) => (
            <section key={reward.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className={tierBadgeStyle[reward.tier]}>{reward.label}</span>
                <span className="muted" style={{ fontSize: "0.8rem" }}>Expires {reward.expiresAt}</span>
              </div>
              <p style={{ marginTop: "0.5rem" }}>
                <strong>{reward.artistName}</strong>
              </p>
              <p className="muted" style={{ fontSize: "0.8rem" }}>Issued {reward.issuedAt}</p>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
