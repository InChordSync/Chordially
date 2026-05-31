const milestones = [
  {
    name: "Authentication",
    summary: "Shared sign-up, login, session, and identity flows across API, web, and mobile."
  },
  {
    name: "Profiles",
    summary: "Contributor-ready user profile primitives for builders, artists, and fans."
  },
  {
    name: "Stellar",
    summary: "Wallet and payment plumbing isolated inside a dedicated service."
  }
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Chordially Hackathon Starter</p>
        <h1>Build the MVP from a clean slate.</h1>
        <p className="lede">
          This repo was reset into a contributor-friendly monorepo with Express, Next.js,
          Expo, and a dedicated Stellar service.
        </p>
        <div className="cta-row">
          <a className="primary-link" href="/auth">
            Open auth milestone
          </a>
          <a className="secondary-link" href="https://stellar.org">
            Learn Stellar
          </a>
        </div>
      </section>

      <section className="milestone-grid">
        {milestones.map((milestone) => (
          <article className="milestone-card" key={milestone.name}>
            <h2>{milestone.name}</h2>
            <p>{milestone.summary}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
