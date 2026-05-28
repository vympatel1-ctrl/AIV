import Link from "next/link";

import { Logo } from "@/components/app/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="grain pointer-events-none absolute inset-x-0 top-0 h-[60vh] -z-10">
        <div className="grid-bg h-full w-full" />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo href="/" size="md" />
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
        >
          Back to site
        </Link>
      </header>

      <main className="mx-auto flex max-w-md flex-col items-stretch px-6 pt-6 pb-16 sm:pt-10">
        {children}
      </main>
    </div>
  );
}
