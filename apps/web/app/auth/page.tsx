const starterSteps = [
  "Create API registration and login contracts.",
  "Connect web forms to real API endpoints.",
  "Add mobile parity for session handling.",
  "Prepare Stellar-linked identity flows."
];

export default function AuthPage() {
  return (
    <main className="page-shell">
      <section className="detail-panel">
        <p className="eyebrow">Milestone 1</p>
        <h1>Authentication starts here.</h1>
        <p className="lede">
          The current baseline is intentionally thin so contributors can shape the first real
          auth implementation together.
        </p>
      </section>

      <section className="detail-panel">
        <h2>Starter scope</h2>
        <ul className="step-list">
          {starterSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
