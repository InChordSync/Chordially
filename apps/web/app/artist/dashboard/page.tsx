import { Shell } from "../../../components/layout/shell";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { getSessionDraft } from "../../../lib/session-store";
import { endSession, saveSession, startSession } from "./actions";

export default function ArtistDashboardPage({
  searchParams
}: {
  searchParams: { saved?: string; started?: string; ended?: string };
}) {
  const session = getSessionDraft();

  return (
    <Shell
      title="Artist dashboard for session control."
      subtitle="Manage the core session lifecycle now, then swap the storage layer for real APIs later without rewriting the surface."
    >
      <div className="grid" style={{ gridTemplateColumns: "1.1fr 0.9fr" }}>
        <Card title="Session details">
          <form action={saveSession} className="stack">
            <div className="stack">
              <label htmlFor="title">Session title</label>
              <Input id="title" defaultValue={session.title} name="title" required />
            </div>
            <div className="stack">
              <label htmlFor="streamUrl">Stream URL</label>
              <Input id="streamUrl" defaultValue={session.streamUrl} name="streamUrl" required />
            </div>
            <div className="stack">
              <label htmlFor="description">Description</label>
              <textarea id="description" className="textarea" defaultValue={session.description} name="description" required />
            </div>
            <button className="button" type="submit">Save session</button>
          </form>
          {searchParams.saved === "1" ? <p className="muted" role="status">Session draft saved.</p> : null}
        </Card>
        <Card title="Live controls">
          <div className="stack">
            <span className="chip" aria-label={`Session status: ${session.status}`}>Status: {session.status}</span>
            {session.startedAt ? <span className="chip">Started: {new Date(session.startedAt).toLocaleString()}</span> : null}
            {session.endedAt ? <span className="chip">Ended: {new Date(session.endedAt).toLocaleString()}</span> : null}
            <form action={startSession}>
              <button className="button" type="submit">Start session</button>
            </form>
            <form action={endSession}>
              <button className="button button--secondary" type="submit">End session</button>
            </form>
            {searchParams.started === "1" ? <p className="muted" role="status">Session marked live.</p> : null}
            {searchParams.ended === "1" ? <p className="muted" role="status">Session marked ended.</p> : null}
          </div>
        </Card>
      </div>
    </Shell>
  );
}
