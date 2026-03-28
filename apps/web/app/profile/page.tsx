import { MarketingShell } from "../../components/layout/marketing-shell";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { getProfile } from "../../lib/profile";
import { saveProfile } from "./actions";

export default function ProfilePage({
  searchParams
}: {
  searchParams: { saved?: string };
}) {
  const profile = getProfile();

  return (
    <MarketingShell
      title="Profile setup and edit flow."
      subtitle="This page gives the team a working account settings surface now, with cookie-backed persistence that can later be swapped for API storage."
    >
      <div className="grid" style={{ gridTemplateColumns: "1.1fr 0.9fr" }}>
        <Card title="Edit profile">
          <form action={saveProfile} className="stack">
            <label className="stack">
              <span>Display name</span>
              <Input defaultValue={profile.displayName} name="displayName" required />
            </label>
            <label className="stack">
              <span>Username</span>
              <Input defaultValue={profile.username} name="username" required />
            </label>
            <label className="stack">
              <span>City</span>
              <Input defaultValue={profile.city} name="city" required />
            </label>
            <label className="stack">
              <span>Bio</span>
              <textarea className="textarea" defaultValue={profile.bio} name="bio" required />
            </label>
            <button className="button button--primary" type="submit">
              Save profile
            </button>
            {searchParams.saved === "1" ? (
              <p className="muted">Profile saved locally for this browser session.</p>
            ) : null}
          </form>
        </Card>
        <Card title="Preview">
          <div className="stack">
            <p>
              <strong>{profile.displayName}</strong>
            </p>
            <p className="muted">@{profile.username}</p>
            <p className="muted">{profile.city}</p>
            <p className="muted">{profile.bio}</p>
          </div>
        </Card>
      </div>
    </MarketingShell>
  );
}
