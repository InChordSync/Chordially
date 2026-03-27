import { MarketingShell } from "../components/layout/marketing-shell";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

const sections = [
  {
    title: "For artists",
    copy: "Start from a clear artist story, share a profile, and give supporters a simple path to follow your next live set."
  },
  {
    title: "For fans",
    copy: "Browse a product narrative that explains the value quickly, then move straight into profile setup without backend dependencies."
  },
  {
    title: "For judges",
    copy: "See the core product promise, user segments, and a concrete next step in one lightweight page."
  }
];

export default function HomePage() {
  return (
    <MarketingShell
      title="A landing page that tells the product story in one screen."
      subtitle="This branch adds the public marketing entry point and a standalone profile setup flow that can ship before API-backed user management."
    >
      <div className="meta">
        <span className="meta-chip">Live tipping</span>
        <span className="meta-chip">Artist discovery</span>
        <span className="meta-chip">Admin-ready foundation</span>
      </div>
      <div className="stack" style={{ marginBottom: 18 }}>
        <div className="meta">
          <Button href="/profile">Open profile setup</Button>
          <Button href="/profile" variant="secondary">
            Edit demo account
          </Button>
        </div>
      </div>
      <div className="grid grid--3">
        {sections.map((section) => (
          <Card key={section.title} title={section.title}>
            <p className="muted">{section.copy}</p>
          </Card>
        ))}
      </div>
    </MarketingShell>
  );
}
