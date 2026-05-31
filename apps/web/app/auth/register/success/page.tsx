import type { AccountState } from "../../../../lib/register-state";

const copy: Record<AccountState, { heading: string; body: string; cta: string; href: string }> = {
  "verify-email": {
    heading: "Check your inbox.",
    body: "We sent a verification link to your email address. Click it to activate your account before signing in.",
    cta: "Back to sign in",
    href: "/auth",
  },
  active: {
    heading: "You're in.",
    body: "Your account is ready. Sign in to get started.",
    cta: "Sign in",
    href: "/auth",
  },
};

export default function RegisterSuccessPage({
  searchParams,
}: {
  searchParams: { state?: string };
}) {
  const state: AccountState =
    searchParams.state === "verify-email" ? "verify-email" : "active";
  const { heading, body, cta, href } = copy[state];

  return (
    <main className="page-shell">
      <section className="detail-panel">
        <p className="eyebrow">Registration complete</p>
        <h1>{heading}</h1>
        <p className="lede">{body}</p>
        <div className="cta-row">
          <a href={href} className="primary-link">
            {cta}
          </a>
        </div>
      </section>
    </main>
  );
}
