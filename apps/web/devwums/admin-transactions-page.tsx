import { AdminShell } from "../../../components/layout/admin-shell";
import { Card } from "../../../components/ui/card";
import { requireAdmin } from "../../../lib/admin-auth";

type TxStatus = "CONFIRMED" | "PENDING" | "FAILED" | "REFUNDED";

interface TxRecord {
  id: string;
  fan: string;
  artist: string;
  amount: string;
  asset: string;
  status: TxStatus;
  createdAt: string;
  txHash?: string;
}

function getSeedTransactions(): TxRecord[] {
  return [
    { id: "tx-001", fan: "Ada Listener", artist: "Nova Chords", amount: "50.00", asset: "XLM", status: "CONFIRMED", createdAt: "2026-03-28", txHash: "abc123ef" },
    { id: "tx-002", fan: "Jay Beats", artist: "Bass Theory", amount: "120.00", asset: "XLM", status: "CONFIRMED", createdAt: "2026-03-27", txHash: "def456gh" },
    { id: "tx-003", fan: "Mira Flow", artist: "Echo Drift", amount: "30.00", asset: "USDC", status: "PENDING", createdAt: "2026-03-29" },
    { id: "tx-004", fan: "Leo Tune", artist: "Nova Chords", amount: "200.00", asset: "XLM", status: "FAILED", createdAt: "2026-03-26" },
    { id: "tx-005", fan: "Ada Listener", artist: "Echo Drift", amount: "75.00", asset: "XLM", status: "REFUNDED", createdAt: "2026-03-25", txHash: "ghi789ij" }
  ];
}

const statusColors: Record<TxStatus, string> = {
  CONFIRMED: "chip chip--success",
  PENDING: "chip",
  FAILED: "chip chip--danger",
  REFUNDED: "chip chip--warning"
};

export default function AdminTransactionsPage() {
  requireAdmin();

  const transactions = getSeedTransactions();
  const confirmed = transactions.filter((t) => t.status === "CONFIRMED");
  const pending = transactions.filter((t) => t.status === "PENDING");
  const failed = transactions.filter((t) => t.status === "FAILED" || t.status === "REFUNDED");

  return (
    <AdminShell
      title="Transaction monitoring"
      subtitle="Live view of tip transactions across the platform with status tracking and hash lookup."
    >
      <div className="grid grid--3">
        <Card title="Confirmed">
          <p>{confirmed.length}</p>
        </Card>
        <Card title="Pending">
          <p>{pending.length}</p>
        </Card>
        <Card title="Failed / Refunded">
          <p>{failed.length}</p>
        </Card>
      </div>

      <Card title="Recent transactions">
        {transactions.map((tx) => (
          <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #eee" }}>
            <div>
              <p className="muted" style={{ margin: 0 }}>{tx.fan} → {tx.artist}</p>
              {tx.txHash && <p className="muted" style={{ fontSize: "0.75rem", margin: 0 }}>#{tx.txHash}</p>}
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span className="chip">{tx.amount} {tx.asset}</span>
              <span className={statusColors[tx.status]}>{tx.status}</span>
              <span className="muted" style={{ fontSize: "0.75rem" }}>{tx.createdAt}</span>
            </div>
          </div>
        ))}
      </Card>
    </AdminShell>
  );
}
