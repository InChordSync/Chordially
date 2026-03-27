"use server";

import { redirect } from "next/navigation";
import { setProfile } from "../../lib/profile";

export async function saveProfile(formData: FormData) {
  setProfile({
    displayName: String(formData.get("displayName") ?? "").trim(),
    username: String(formData.get("username") ?? "").trim(),
    bio: String(formData.get("bio") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim()
  });

  redirect("/profile?saved=1");
}
