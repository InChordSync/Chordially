import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AuthStatus } from "./_components/auth-status";

import "./globals.css";

export const metadata: Metadata = {
  title: "Chordially Starter",
  description: "Open source hackathon starter for Chordially."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header style={{ padding: "22px 20px 0", maxWidth: 1040, margin: "0 auto" }}>
          <nav style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <a href="/" className="eyebrow" style={{ margin: 0 }}>
              Chordially starter
            </a>
            <AuthStatus />
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
