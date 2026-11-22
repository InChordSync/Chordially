import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { AuthProvider } from "../lib/auth-context"
import "./globals.css"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chordially.app"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Chordially",
    template: "%s | Chordially",
  },
  description:
    "Chordially helps creators build fan communities, share updates, and receive support across web and mobile.",
  openGraph: {
    type: "website",
    siteName: "Chordially",
    title: "Chordially",
    description:
      "Chordially helps creators build fan communities, share updates, and receive support across web and mobile.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chordially",
    description:
      "Chordially helps creators build fan communities, share updates, and receive support across web and mobile.",
  },
}

export const viewport: Viewport = {
  themeColor: "#0f172a",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
