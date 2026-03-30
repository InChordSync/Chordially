import { notFound } from "next/navigation";
import { Shell } from "../../../components/layout/shell";
import { Card } from "../../../components/ui/card";
import { getSessionDetail } from "../../../lib/session-detail";
import { getTipIntent } from "../../../lib/tip-intent";
import { TipForm } from "./tip-form";

export default function SessionDetailPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: { intent?: string };
}) {
  const session = getSessionDetail(params.slug);

  if (!session) {
    notFound();
  }

  const latestIntent = getTipIntent();
  const showIntent = latestIntent?.artistSlug === params.slug ? latestIntent : null;

  return (
    <Shell
      title={session.artistName}
      subtitle="A stable session detail contract with placeholder tipping UI and persisted draft intent state."
    >
      <div className="grid" style={{ gridTemplateColumns: "1.1fr 0.9fr" }}>
        <Card title={session.title}>
          <div>
            <span className="chip">{session.city}</span>
            <span className="chip">{session.streamStatus === "live" ? "Live now" : "Session ended"}</span>
            <span className="chip">Tips in {session.walletAsset}</span>
          </div>
          <p className="muted">{session.description}</p>
          <p className="muted">Real-time tip feed and transaction status will attach to this page in later branches.</p>
        </Card>
        <Card title="Tip draft">
          <TipForm
            artistSlug={session.slug}
            defaultAsset={session.walletAsset}
            showConfirmation={searchParams.intent === "1"}
            confirmedAmount={showIntent?.amount}
            confirmedAsset={showIntent?.asset}
          />
        </Card>
      </div>
    </Shell>
  );
}
