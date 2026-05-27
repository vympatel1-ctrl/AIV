import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * AIV brand mark + wordmark.
 *
 * The mark is a serifed play wedge that doubles as the letter A — a triangle
 * pointing right with a horizontal crossbar carved through it. See BRAND.md.
 */
export function Logo({
  className,
  withText = true,
  href = "/dashboard",
  size = "md",
}: {
  className?: string;
  withText?: boolean;
  href?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim =
    size === "sm" ? "size-6" : size === "lg" ? "size-9" : "size-7";
  const text =
    size === "sm"
      ? "text-base"
      : size === "lg"
      ? "text-2xl"
      : "text-lg";

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 outline-none",
        className
      )}
      aria-label="AIV"
    >
      <Mark className={dim} />
      {withText && (
        <span
          className={cn(
            "font-display italic tracking-tight",
            text,
            "text-foreground"
          )}
        >
          AIV
        </span>
      )}
    </Link>
  );
}

export function Mark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground",
        className
      )}
    >
      <svg
        viewBox="0 0 32 32"
        className="size-[70%]"
        fill="none"
        role="presentation"
      >
        <path d="M9 6 L9 26 L25.5 16 Z" fill="currentColor" />
        <rect x="9" y="17" width="10.5" height="1.6" fill="var(--primary)" />
      </svg>
    </span>
  );
}
