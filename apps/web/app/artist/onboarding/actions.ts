"use server";

import { redirect } from "next/navigation";
import { setArtist } from "../../../lib/artist";

export async function saveArtist(formData: FormData) {
  setArtist({
    stageName: String(formData.get("stageName") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    genres: String(formData.get("genres") ?? "").trim(),
    bio: String(formData.get("bio") ?? "").trim(),
    wallet: String(formData.get("wallet") ?? "").trim()
  });

  redirect(`/artists/${String(formData.get("slug") ?? "").trim()}?onboarded=1`);
}
