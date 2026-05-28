import Link from "next/link";
import { LogOutIcon, PlusIcon, SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from "@/app/auth/actions";
import { CreditMeter } from "./credit-meter";

export function Topbar({
  credits,
  email,
  name,
}: {
  credits: number;
  email: string;
  name: string;
}) {
  const initials = (name || email)
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-foreground/10 bg-background/80 px-4 backdrop-blur-md sm:px-6">
      {/* Left — search, hidden on mobile */}
      <div className="hidden min-w-0 max-w-md flex-1 sm:block">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects, assets…"
            className="h-9 border-foreground/10 bg-card pl-9 text-sm placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex flex-1 items-center justify-end gap-3">
        <Link href="/projects/new" className="hidden sm:inline-flex">
          <Button size="sm" variant="outline">
            <PlusIcon />
            New project
          </Button>
        </Link>

        <CreditMeter credits={credits} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-ring/60">
              <Avatar className="size-9 border border-foreground/10">
                <AvatarFallback className="bg-secondary text-xs font-medium text-foreground">
                  {initials || "AV"}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">
                {name || "Demo Founder"}
              </span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/billing">Billing</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild variant="destructive">
              <form action={signOut} className="w-full">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 text-sm"
                >
                  <LogOutIcon className="size-4" />
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
