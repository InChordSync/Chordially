import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chordially",
  description: "Public landing and profile setup flow."
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
