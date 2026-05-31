type VerifyOutcome = "success" | "already-verified" | "expired" | "invalid" | "missing";

const outcomeContent: Record<
  VerifyOutcome,
  { heading: string; body: string; cta: string; href: string }
> = {
  success: {
    heading: "Email verified.",
    body: "Your account is now active. Sign in to get started.",
    cta: "Sign in",
    href: "/auth",
  },
  "already-verified": {
    heading: "Already verified.",
    body: "This account has already been verified. Sign in below.",
    cta: "Sign in",
    href: "/auth",
  },
  expired: {
    heading: "Link expired.",
    body: "This verification link has expired. Request a new one from the sign-in page.",
    cta: "Back to sign in",
    href: "/auth",
  },
  invalid: {
    heading: "Invalid link.",
    body: "This verification link is not valid. It may have already been used or was malformed.",
    cta: "Back to sign in",
    href: "/auth",
  },
  missing: {
    heading: "No token.",
    body: "This page requires a verification token. Use the link from your email.",
    cta: "Back to sign in",
    href: "/auth",
  },
};

async function resolveOutcome(token: string): Promise<VerifyOutcome> {
  try {
    const res = await fetch(
      `${process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "http://localhost:4000"}/api/v1/auth/verify-email`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }), cache: "no-store" }
    );
    if (res.ok) return "success";
    const body = await res.json() as { error?: string };
    if (body.error === "TOKEN_EXPIRED") return "expired";
    if (body.error === "TOKEN_INVALID") return "invalid";
    // A 409 or similar can indicate already-verified
    if (res.status === 409) return "already-verified";
    return "invalid";
  } catch {
    return "invalid";
  }
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;
  const outcome: VerifyOutcome = token ? await resolveOutcome(token) : "missing";
  const { heading, body, cta, href } = outcomeContent[outcome];

  return (
    <main className="page-shell">
      <section className="detail-panel">
        <p className="eyebrow">Email verification</p>
        <h1>{heading}</h1>
        <p className="lede">{body}</p>
        <div className="cta-row">
          <a href={href} className="primary-link">{cta}</a>
        </div>
      </section>
    </main>
  );
}
