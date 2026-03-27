import { ReactNode } from "react";

export function MarketingShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="page-shell">
      <section className="hero-panel">
        <p className="eyebrow">Chordially</p>
        <h1>{title}</h1>
        <p className="hero-copy">{subtitle}</p>
      </section>
      {children}
    </main>
  );
}
