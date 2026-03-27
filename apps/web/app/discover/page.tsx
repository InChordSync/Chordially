import { Shell } from "../../components/layout/shell";
import { Card } from "../../components/ui/card";
import { listDiscoverySessions } from "../../lib/discovery";

export default function DiscoverPage({
  searchParams
}: {
  searchParams: { status?: "live" | "upcoming" };
}) {
  const status = searchParams.status === "upcoming" ? "upcoming" : "live";
  const data = listDiscoverySessions({ status });

  return (
    <Shell
      title={status === "live" ? "Live discovery feed." : "Upcoming discovery feed."}
      subtitle="Artists are listed through a simple discovery contract with pagination-ready metadata."
    >
      <div className="nav">
        <a className="button" href="/discover">Live</a>
        <a className="button button--secondary" href="/discover?status=upcoming">Upcoming</a>
      </div>
      <div className="grid">
        {data.items.map((session) => (
          <Card key={session.id} title={session.artistName}>
            <p className="muted">{session.title}</p>
            <div>
              <span className="chip">{session.city}</span>
              {session.genres.map((genre) => (
                <span className="chip" key={genre}>{genre}</span>
              ))}
            </div>
            <p className="muted">
              {session.isLive ? "Live now" : "Starts"}: {new Date(session.startsAt).toLocaleString()}
            </p>
            <a className="button" href={`/artists/${session.slug}`}>View session</a>
          </Card>
        ))}
        {data.items.length === 0 ? (
          <Card title="No sessions">
            <p className="muted">No sessions matched this state.</p>
          </Card>
        ) : null}
      </div>
    </Shell>
  );
}
