"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCardIcon,
  FolderIcon,
  HomeIcon,
  ImageIcon,
  LayersIcon,
  LayoutDashboardIcon,
  PaletteIcon,
  PenLineIcon,
  PlayIcon,
  PrinterIcon,
  SettingsIcon,
  ShieldIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "./logo";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const main: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/projects", label: "Projects", icon: FolderIcon },
  { href: "/brand-kits", label: "Brand Kits", icon: PaletteIcon },
];

const studio: NavItem[] = [
  { href: "/studio/copy", label: "Copy", icon: PenLineIcon },
  { href: "/studio/image", label: "Image", icon: ImageIcon },
  { href: "/studio/video", label: "Video", icon: PlayIcon },
  { href: "/studio/flyer", label: "Flyer", icon: PrinterIcon },
];

const account: NavItem[] = [
  { href: "/billing", label: "Billing", icon: CreditCardIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

const adminItems: NavItem[] = [
  { href: "/admin", label: "Admin", icon: ShieldIcon },
];

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-border/60 bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-16 items-center gap-2 px-6">
        <Logo />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6 scrollbar-thin">
        <Section label="Workspace" items={main} pathname={pathname} />
        <Section
          label="Studio"
          items={studio}
          pathname={pathname}
          icon={LayersIcon}
        />
        <Section label="Account" items={account} pathname={pathname} />
        {isAdmin && (
          <Section label="System" items={adminItems} pathname={pathname} />
        )}
      </nav>

      <div className="border-t border-sidebar-border p-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <HomeIcon className="size-3.5" />
          <span>v0.1 · MVP</span>
        </div>
      </div>
    </aside>
  );
}

function Section({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="mt-6 first:mt-2">
      <div className="px-3 pb-2 text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </div>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "size-4 transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span>{item.label}</span>
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-y-1 right-2 w-px bg-primary/60"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
