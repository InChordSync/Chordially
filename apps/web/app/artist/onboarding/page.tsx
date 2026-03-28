import { Shell } from "../../../components/layout/shell";
import { Card } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { getArtist } from "../../../lib/artist";
import { saveArtist } from "./actions";

export default function ArtistOnboardingPage() {
  const artist = getArtist();

  return (
    <Shell
      title="Set up an artist profile."
      subtitle="This form is intentionally self-contained so product and design work can continue even before the profile API lands."
    >
      <Card title="Artist details">
        <form action={saveArtist} className="stack">
          <label className="stack">
            <span>Stage name</span>
            <Input defaultValue={artist.stageName} name="stageName" required />
          </label>
          <label className="stack">
            <span>Profile slug</span>
            <Input defaultValue={artist.slug} name="slug" required />
          </label>
          <label className="stack">
            <span>City</span>
            <Input defaultValue={artist.city} name="city" required />
          </label>
          <label className="stack">
            <span>Genres</span>
            <Input defaultValue={artist.genres} name="genres" required />
          </label>
          <label className="stack">
            <span>Wallet</span>
            <Input defaultValue={artist.wallet} name="wallet" required />
          </label>
          <label className="stack">
            <span>Bio</span>
            <textarea className="textarea" defaultValue={artist.bio} name="bio" required />
          </label>
          <button className="button" type="submit">
            Save artist profile
          </button>
        </form>
      </Card>
    </Shell>
  );
}
