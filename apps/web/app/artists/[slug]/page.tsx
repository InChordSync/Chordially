import { notFound } from "next/navigation";
import { Shell } from "../../../components/layout/shell";
import { Card } from "../../../components/ui/card";
import { getArtistBySlug } from "../../../lib/artist";

export default function ArtistProfilePage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: { onboarded?: string };
}) {
  const artist = getArtistBySlug(params.slug);

  if (!artist) {
    notFound();
  }

  return (
    <Shell
      title={artist.stageName}
      subtitle="Public artist profile route for sharing identity, genre, city, and wallet readiness."
    >
      <div className="grid" style={{ gridTemplateColumns: "1.1fr 0.9fr" }}>
        <Card title="Artist story">
          <div className="meta" style={{ marginBottom: 16 }}>
            <span className="meta-chip">{artist.city}</span>
            {artist.genres.split(",").map((genre) => (
              <span className="meta-chip" key={genre.trim()}>
                {genre.trim()}
              </span>
            ))}
          </div>
          <p className="muted">{artist.bio}</p>
          <p className="muted">Wallet: {artist.wallet}</p>
          {searchParams.onboarded === "1" ? (
            <p className="muted">Artist onboarding details were saved successfully.</p>
          ) : null}
        </Card>
        <Card title="Profile link">
          <p className="muted">
            This slug-based page is ready to become the shareable public artist destination in later branches.
          </p>
          <a className="button button--secondary" href="/artist/onboarding">
            Edit artist profile
          </a>
        </Card>
      </div>
    </Shell>
  );
}
