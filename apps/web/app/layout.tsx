import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chordially Discovery",
  description: "Discovery contract and fan-facing session feed."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
