import type { MetadataRoute } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chordially.app"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/profile", "/login", "/register", "/forgot-password", "/reset-password"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
