import { notFound } from "next/navigation";
import { Shell } from "../../../components/layout/shell";
import { Card } from "../../../components/ui/card";
import { listDiscoverySessions } from "../../../lib/discovery";

export default function ArtistDetailPage({
  params
}: {
  params: { slug: string };
}) {
  const session = listDiscoverySessions({ status: "live", limit: 100 }).items
    .concat(listDiscoverySessions({ status: "upcoming", limit: 100 }).items)
    .find((item) => item.slug === params.slug);

  if (!session) {
    notFound();
  }

  return (
    <Shell
      title={session.artistName}
      subtitle="A lightweight destination page that discovery cards can safely link to today."
    >
      <Card title={session.title}>
        <div>
          <span className="chip">{session.city}</span>
          {session.genres.map((genre) => (
            <span className="chip" key={genre}>{genre}</span>
          ))}
        </div>
        <p className="muted">
          {session.isLive ? "This artist is live now." : "This artist has an upcoming set."}
        </p>
      </Card>
    </Shell>
  );
}
