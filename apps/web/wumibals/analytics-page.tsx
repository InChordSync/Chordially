import { AdminShell } from "../../../components/layout/admin-shell";
import { Card } from "../../../components/ui/card";
import { requireAdmin } from "../../../lib/admin-auth";
import { getAdminSummary } from "../../../lib/admin-summary";

function getAnalyticsData() {
  const summary = getAdminSummary();
  return {
    totalRevenue: "1,248.50 XLM",
    avgTipPerSession: "36.72 XLM",
    topAsset: "XLM",
    conversionRate: "23.9%",
    activeArtists: summary.totalArtists,
    totalFans: summary.totalUsers - summary.totalArtists,
    liveSessions: summary.activeSessions,
    tipsThisWeek: summary.recentTips,
    topArtists: [
      { name: "Nova Chords", tips: 18, revenue: "420.00 XLM" },
      { name: "Bass Theory", tips: 11, revenue: "310.50 XLM" },
      { name: "Echo Drift", tips: 5, revenue: "180.00 XLM" }
    ]
  };
}

export default function AdminAnalyticsPage() {
  requireAdmin();

  const data = getAnalyticsData();

  return (
    <AdminShell
      title="Platform analytics"
      subtitle="Key performance indicators across tipping activity, sessions, and artist engagement."
    >
      <div className="grid grid--4">
        <Card title="Total revenue">
          <p>{data.totalRevenue}</p>
        </Card>
        <Card title="Avg tip / session">
          <p>{data.avgTipPerSession}</p>
        </Card>
        <Card title="Conversion rate">
          <p>{data.conversionRate}</p>
        </Card>
        <Card title="Tips this week">
          <p>{data.tipsThisWeek}</p>
        </Card>
      </div>

      <div className="grid grid--3">
        <Card title="Active artists">
          <p>{data.activeArtists}</p>
        </Card>
        <Card title="Total fans">
          <p>{data.totalFans}</p>
        </Card>
        <Card title="Live sessions">
          <p>{data.liveSessions}</p>
        </Card>
      </div>

      <Card title="Top artists by tips">
        {data.topArtists.map((artist) => (
          <div key={artist.name} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
            <span className="muted">{artist.name}</span>
            <span className="chip">{artist.tips} tips</span>
            <span className="chip">{artist.revenue}</span>
          </div>
        ))}
      </Card>
    </AdminShell>
  );
}
