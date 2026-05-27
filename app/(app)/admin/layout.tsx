import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ActivityIcon,
  ShieldIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth/current-user";

const tabs = [
  { href: "/admin", label: "Overview", icon: ShieldIcon },
  { href: "/admin/users", label: "Users", icon: UsersIcon },
  { href: "/admin/usage", label: "Usage", icon: ActivityIcon },
  { href: "/admin/moderation", label: "Moderation", icon: WalletIcon },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      {/* Editorial title plate */}
      <div className="flex flex-col gap-5 border-b border-foreground/10 pb-7">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              System
            </p>
            <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
              Admin
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Operations console — usage, billing, and moderation.
            </p>
          </div>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:block">
            Issue · 01
          </span>
        </div>
        <nav className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-card px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
            >
              <t.icon className="size-3.5" />
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
