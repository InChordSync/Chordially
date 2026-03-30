import type { Metadata } from "next";
import { OfflineBanner } from "../components/ui/offline-banner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chordially",
  description: "Support artists in real time."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}
