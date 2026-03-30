/**
 * Issue #80 – Add user and artist status management for admins
 *
 * File destination: apps/web/app/admin/users/page.tsx
 *
 * What this does:
 *  - Server Component guarded by requireAdmin()
 *  - Lists all users and artist profiles with their current status
 *  - Provides one-click actions: Suspend, Deactivate, Reactivate
 *  - Actions call server action that PATCHes /admin/users/:id/status
 *  - Falls back to demo data if API is unreachable
 *
 * Acceptance criteria covered:
 *  ✓ Suspended users cannot perform restricted actions (API enforces this)
 *  ✓ Deactivated artists do not appear in discovery (filtered in search)
 *  ✓ All status changes are audited (audit log on backend)
 *
 * Navigation: add link to /admin/users in AdminShell sidebar.
 */

import { AdminShell } from "../../../components/layout/admin-shell";
import { Card } from "../../../components/ui/card";
import { requireAdmin } from "../../../lib/admin-auth";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: "fan" | "artist" | "admin";
  status: UserStatus;
  createdAt: string;
}

// ─── Demo fallback ────────────────────────────────────────────────────────────

const DEMO_USERS: UserRecord[] = [
  { id: "fan-1", name: "Ada Listener", email: "ada@demo.local", role: "fan", status: "ACTIVE", createdAt: "2026-03-01T10:00:00.000Z" },
  { id: "fan-2", name: "Kwame Beats", email: "kwame@demo.local", role: "fan", status: "ACTIVE", createdAt: "2026-03-05T11:00:00.000Z" },
  { id: "fan-3", name: "Zara M.", email: "zara@demo.local", role: "fan", status: "SUSPENDED", createdAt: "2026-03-10T09:00:00.000Z" },
  { id: "artist-1", name: "Nova Chords", email: "nova@demo.local", role: "artist", status: "ACTIVE", createdAt: "2026-02-15T08:00:00.000Z" },
  { id: "artist-2", name: "Street Tempo", email: "street@demo.local", role: "artist", status: "ACTIVE", createdAt: "2026-02-20T08:00:00.000Z" },
  { id: "artist-3", name: "Midnight Strings", email: "midnight@demo.local", role: "artist", status: "DEACTIVATED", createdAt: "2026-02-25T08:00:00.000Z" },
];

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchUsers(): Promise<UserRecord[]> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  try {
    const res = await fetch(`${API_URL}/admin/users`, {
      headers: { "x-demo-admin": "true" },
      cache: "no-store",
    });
    if (!res.ok) return DEMO_USERS;
    const data = (await res.json()) as { items: UserRecord[] };
    return data.items;
  } catch {
    return DEMO_USERS;
  }
}

// ─── Server Action ────────────────────────────────────────────────────────────

async function updateUserStatus(formData: FormData) {
  "use server";
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const userId = formData.get("userId") as string;
  const status = formData.get("status") as string;

  await fetch(`${API_URL}/admin/users/${userId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-demo-admin": "true",
    },
    body: JSON.stringify({ status }),
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status: UserStatus): string {
  if (status === "ACTIVE") return "#4ade80";
  if (status === "SUSPENDED") return "#facc15";
  return "#f87171";
}

function availableTransitions(status: UserStatus): { label: string; value: UserStatus }[] {
  if (status === "ACTIVE") {
    return [
      { label: "Suspend", value: "SUSPENDED" },
      { label: "Deactivate", value: "DEACTIVATED" },
    ];
  }
  if (status === "SUSPENDED") {
    return [
      { label: "Reactivate", value: "ACTIVE" },
      { label: "Deactivate", value: "DEACTIVATED" },
    ];
  }
  // DEACTIVATED
  return [{ label: "Reactivate", value: "ACTIVE" }];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminUsersPage() {
  requireAdmin();

  const users = await fetchUsers();

  const active = users.filter((u) => u.status === "ACTIVE").length;
  const suspended = users.filter((u) => u.status === "SUSPENDED").length;
  const deactivated = users.filter((u) => u.status === "DEACTIVATED").length;

  return (
    <AdminShell
      title="User status management"
      subtitle="View and manage user and artist account statuses. All changes are recorded in the audit log."
    >
      {/* ── Summary ── */}
      <div className="grid grid--4">
        <Card title="Total users"><p>{users.length}</p></Card>
        <Card title="Active"><p style={{ color: "#4ade80" }}>{active}</p></Card>
        <Card title="Suspended"><p style={{ color: "#facc15" }}>{suspended}</p></Card>
        <Card title="Deactivated"><p style={{ color: "#f87171" }}>{deactivated}</p></Card>
      </div>

      {/* ── User list ── */}
      <Card title="All accounts">
        <div className="stack">
          {users.map((user) => (
            <div
              key={user.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 0",
                borderBottom: "1px solid var(--line)",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              {/* Identity */}
              <div style={{ minWidth: 180 }}>
                <p className="label" style={{ marginBottom: 2 }}>{user.name}</p>
                <p className="muted" style={{ margin: 0, fontSize: "0.8rem" }}>{user.email}</p>
                <p className="muted" style={{ margin: "2px 0 0", fontSize: "0.75rem" }}>
                  Joined {formatDate(user.createdAt)}
                </p>
              </div>

              {/* Badges */}
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span className="chip">{user.role}</span>
                <span
                  className="chip"
                  style={{ color: statusColor(user.status), borderColor: statusColor(user.status) }}
                >
                  {user.status.toLowerCase()}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {availableTransitions(user.status).map(({ label, value }) => (
                  <form key={value} action={updateUserStatus}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="status" value={value} />
                    <button
                      className="button button--secondary"
                      type="submit"
                      style={{
                        fontSize: "0.8rem",
                        ...(value === "DEACTIVATED"
                          ? { color: "#f87171", borderColor: "#f87171" }
                          : value === "SUSPENDED"
                          ? { color: "#facc15", borderColor: "#facc15" }
                          : {}),
                      }}
                    >
                      {label}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AdminShell>
  );
}
