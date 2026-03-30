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
          <div className="stack">
            <label htmlFor="stageName">Stage name</label>
            <Input id="stageName" defaultValue={artist.stageName} name="stageName" required />
          </div>
          <div className="stack">
            <label htmlFor="slug">Profile slug</label>
            <Input id="slug" defaultValue={artist.slug} name="slug" required />
          </div>
          <div className="stack">
            <label htmlFor="city">City</label>
            <Input id="city" defaultValue={artist.city} name="city" required />
          </div>
          <div className="stack">
            <label htmlFor="genres">Genres</label>
            <Input id="genres" defaultValue={artist.genres} name="genres" required />
          </div>
          <div className="stack">
            <label htmlFor="wallet">Wallet</label>
            <Input id="wallet" defaultValue={artist.wallet} name="wallet" required />
          </div>
          <div className="stack">
            <label htmlFor="bio">Bio</label>
            <textarea id="bio" className="textarea" defaultValue={artist.bio} name="bio" required />
          </div>
          <button className="button" type="submit">
            Save artist profile
          </button>
        </form>
      </Card>
    </Shell>
  );
}
