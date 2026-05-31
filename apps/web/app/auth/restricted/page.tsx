import { parseRestriction, type AccountRestriction } from "../../../lib/account-restriction";

type CopyBlock = {
  eyebrow: string;
  heading: string;
  body: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
};

function copyFor(restriction: AccountRestriction): CopyBlock {
  switch (restriction) {
    case "disabled":
      return {
        eyebrow: "Account disabled",
        heading: "This account is currently disabled.",
        body: "Sign-in is blocked for this account. If you believe this is a mistake, open an issue or contact the maintainers with the email you attempted to use.",
        primary: { label: "Contact maintainers", href: "https://github.com/InChordSync/Chordially/issues" },
        secondary: { label: "Back to sign in", href: "/auth" },
      };
    case "banned":
      return {
        eyebrow: "Account banned",
        heading: "This account is banned.",
        body: "Sign-in is blocked permanently for this account. If you need help, contact the maintainers with relevant context.",
        primary: { label: "Contact maintainers", href: "https://github.com/InChordSync/Chordially/issues" },
        secondary: { label: "Back to sign in", href: "/auth" },
      };
    default:
      return {
        eyebrow: "Account restricted",
        heading: "This account can’t sign in right now.",
        body: "The API reported an account restriction state for this sign-in attempt. Contact the maintainers if you need access restored.",
        primary: { label: "Contact maintainers", href: "https://github.com/InChordSync/Chordially/issues" },
        secondary: { label: "Back to sign in", href: "/auth" },
      };
  }
}

export default function RestrictedAccountPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const restriction = parseRestriction(searchParams.status);
  const { eyebrow, heading, body, primary, secondary } = copyFor(restriction);

  return (
    <main className="page-shell">
      <section className="detail-panel">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{heading}</h1>
        <p className="lede">{body}</p>
        <div className="cta-row">
          <a className="primary-link" href={primary.href}>
            {primary.label}
          </a>
          {secondary ? (
            <a className="secondary-link" href={secondary.href}>
              {secondary.label}
            </a>
          ) : null}
        </div>
      </section>
    </main>
  );
}

