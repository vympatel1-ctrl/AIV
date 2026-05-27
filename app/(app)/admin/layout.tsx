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
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          System
        </p>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
          Admin
        </h1>
      </div>
      <nav className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-card px-3 py-1.5 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            <t.icon className="size-3.5" />
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
