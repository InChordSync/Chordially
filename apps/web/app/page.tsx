import { Shell } from "../components/layout/shell";
import { Card } from "../components/ui/card";
import { listDiscoverySessions } from "../lib/discovery";

export default function HomePage() {
  const live = listDiscoverySessions({ status: "live" });

  return (
    <Shell
      title="Discovery built against a stable local contract."
      subtitle="This branch adds the discovery data shape and a fan-facing feed so UI work can merge before the real backend endpoint exists."
    >
      <div className="nav">
        <a className="button" href="/discover">Browse live sessions</a>
        <a className="button button--secondary" href="/discover?status=upcoming">Browse upcoming sessions</a>
      </div>
      <Card title="Current availability">
        <p className="muted">{live.total} live sessions are available in the demo feed right now.</p>
      </Card>
    </Shell>
  );
}
