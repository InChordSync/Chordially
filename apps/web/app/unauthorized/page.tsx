import { parseUnauthorizedReason, type UnauthorizedReason } from "../../lib/unauthorized";

type UnauthorizedCopy = {
  eyebrow: string;
  heading: string;
  body: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
};

function copyFor(reason: UnauthorizedReason, next?: string): UnauthorizedCopy {
  const safeNext = typeof next === "string" && next.startsWith("/") ? next : undefined;

  switch (reason) {
    case "signed-out":
      return {
        eyebrow: "Unauthorized",
        heading: "You need to sign in.",
        body: "This page is protected. Sign in to continue, or head back to the starter home.",
        primary: { label: "Go to sign in", href: "/auth" },
        secondary: safeNext ? { label: "Back to previous page", href: safeNext } : { label: "Go home", href: "/" },
      };
    case "expired":
      return {
        eyebrow: "Session expired",
        heading: "Your session timed out.",
        body: "For your security, we signed you out after inactivity. Sign in again to continue.",
        primary: { label: "Sign in again", href: "/auth" },
        secondary: safeNext ? { label: "Return to where you were", href: safeNext } : { label: "Go home", href: "/" },
      };
    case "forbidden":
      return {
        eyebrow: "Access denied",
        heading: "You’re signed in, but don’t have permission.",
        body: "The account you used doesn’t have access to this route yet. You can switch accounts or return home.",
        primary: { label: "Switch account", href: "/auth" },
        secondary: { label: "Go home", href: "/" },
      };
    default:
      return {
        eyebrow: "Unauthorized",
        heading: "We can’t open that page.",
        body: "The app couldn’t confirm you have an active session for this route. Try signing in again.",
        primary: { label: "Go to sign in", href: "/auth" },
        secondary: { label: "Go home", href: "/" },
      };
  }
}

export default function UnauthorizedPage({
  searchParams,
}: {
  searchParams: { reason?: string; next?: string };
}) {
  const reason = parseUnauthorizedReason(searchParams.reason);
  const { eyebrow, heading, body, primary, secondary } = copyFor(reason, searchParams.next);

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
