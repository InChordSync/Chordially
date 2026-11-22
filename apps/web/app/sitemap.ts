import type { MetadataRoute } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chordially.app"
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/discover`, changeFrequency: "daily", priority: 0.8 },
  ]

  try {
    const res = await fetch(`${apiUrl}/api/creators?limit=100`, { next: { revalidate: 3600 } as any })
    if (!res.ok) return staticEntries
    const data: any = await res.json().catch(() => null)
    const creators = Array.isArray(data) ? data : Array.isArray(data?.creators) ? data.creators : []
    const creatorEntries: MetadataRoute.Sitemap = creators
      .map((c: any) => c?.slug)
      .filter((slug: any): slug is string => typeof slug === "string" && slug.length > 0)
      .map((slug: string) => ({
        url: `${siteUrl}/creators/${encodeURIComponent(slug)}`,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }))
    return [...staticEntries, ...creatorEntries]
  } catch {
    return staticEntries
  }
}
