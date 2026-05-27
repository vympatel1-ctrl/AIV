"use client";

import { cn } from "@/lib/utils";
import { PLATFORMS, type Platform } from "@/lib/platform-presets";

const ENTRIES = Object.entries(PLATFORMS) as [
  Platform,
  (typeof PLATFORMS)[Platform],
][];

export function PlatformSelector({
  value,
  onChange,
}: {
  value: Platform;
  onChange: (next: Platform) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {ENTRIES.map(([key, p]) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "rounded-lg border px-3 py-3 text-left text-sm transition",
              active
                ? "border-primary/60 bg-primary/10 text-foreground"
                : "border-border/60 bg-card text-muted-foreground hover:border-border"
            )}
          >
            <div className="font-medium text-foreground">{p.label}</div>
            <div className="text-[11px] text-muted-foreground">
              {p.defaultAspect}
            </div>
          </button>
        );
      })}
    </div>
  );
}
