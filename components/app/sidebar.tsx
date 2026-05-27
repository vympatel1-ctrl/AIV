"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCardIcon,
  FolderIcon,
  ImageIcon,
  LayoutDashboardIcon,
  LibraryIcon,
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
  { href: "/library", label: "Library", icon: LibraryIcon },
  { href: "/projects", label: "Projects", icon: FolderIcon },
  { href: "/brand-kits", label: "Brand kits", icon: PaletteIcon },
];

const studio: NavItem[] = [
  { href: "/studio/copy", label: "Copy", icon: PenLineIcon },
  { href: "/studio/image", label: "Image", icon: ImageIcon },
  { href: "/studio/video", label: "Video", icon: PlayIcon },
  { href: "/studio/flyer", label: "Print", icon: PrinterIcon },
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
    <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-foreground/10 bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 pb-6">
        <Section label="Workspace" items={main} pathname={pathname} />
        <Section label="Studio" items={studio} pathname={pathname} />
        <Section label="Account" items={account} pathname={pathname} />
        {isAdmin && (
          <Section label="System" items={adminItems} pathname={pathname} />
        )}
      </nav>

      <div className="border-t border-foreground/10 p-4 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>v1 · Editorial</span>
          <span className="font-mono normal-case tracking-normal text-foreground/40">
            01
          </span>
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
}) {
  return (
    <div className="mt-7 first:mt-3">
      <div className="px-3 pb-2 text-[10px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
        {label}
      </div>
      <ul className="space-y-px">
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
                    : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground"
                )}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-y-1.5 left-0 w-0.5 rounded-r bg-primary"
                  />
                )}
                <item.icon
                  className={cn(
                    "size-4 transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
