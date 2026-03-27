import { ReactNode } from "react";

export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card">
      <p className="label">{title}</p>
      <div>{children}</div>
    </section>
  );
}
