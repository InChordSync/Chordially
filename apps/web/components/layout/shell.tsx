import { ReactNode } from "react";

export function Shell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Chordially</p>
        <h1>{title}</h1>
        <p className="copy">{subtitle}</p>
      </section>
      {children}
    </main>
  );
}
