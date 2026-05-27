import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({
  className,
  withText = true,
}: {
  className?: string;
  withText?: boolean;
}) {
  return (
    <Link
      href="/dashboard"
      className={cn("flex items-center gap-2.5", className)}
    >
      <span
        aria-hidden
        className="relative inline-block size-7 rounded-md gold-gradient luxury-glow"
      />
      {withText && (
        <span className="font-display text-base tracking-wide">Aurum</span>
      )}
    </Link>
  );
}
