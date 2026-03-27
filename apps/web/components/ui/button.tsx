import Link from "next/link";
import { ReactNode } from "react";

export function Button({
  href,
  children,
  variant = "primary"
}: {
  href?: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const className = `button button--${variant}`;

  if (href) {
    return (
      <Link className={className} href={href}>
        {children}
      </Link>
    );
  }

  return <button className={className}>{children}</button>;
}
