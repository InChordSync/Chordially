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
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <main className="shell" id="main-content">
        <header className="hero">
          <p className="eyebrow" aria-hidden="true">Chordially</p>
          <h1>{title}</h1>
          <p className="hero__copy">{subtitle}</p>
        </header>
        {children}
      </main>
    </>
  );
}
