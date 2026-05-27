"use client";

import { cn } from "@/lib/utils";
import {
  ASPECT_LABELS,
  type AspectRatio,
} from "@/lib/platform-presets";

export function AspectRatioPicker({
  value,
  onChange,
  options,
}: {
  value: AspectRatio;
  onChange: (next: AspectRatio) => void;
  options?: AspectRatio[];
}) {
  const list =
    options ?? (Object.keys(ASPECT_LABELS) as AspectRatio[]);
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {list.map((ar) => {
        const active = value === ar;
        const ratio = parseRatio(ar);
        return (
          <button
            key={ar}
            type="button"
            onClick={() => onChange(ar)}
            className={cn(
              "rounded-lg border px-2 py-2.5 text-xs transition",
              active
                ? "border-primary/60 bg-primary/10 text-foreground"
                : "border-border/60 bg-card text-muted-foreground hover:border-border"
            )}
          >
            <div className="mx-auto mb-1.5 flex h-8 items-center justify-center">
              <div
                className={cn(
                  "rounded-sm border",
                  active
                    ? "border-primary/60 bg-primary/20"
                    : "border-border bg-secondary"
                )}
                style={{
                  width: `${Math.min(ratio * 22, 32)}px`,
                  height: `${Math.min(22, 32 / ratio)}px`,
                }}
              />
            </div>
            <div className="text-foreground">{ar}</div>
          </button>
        );
      })}
    </div>
  );
}

function parseRatio(ar: AspectRatio): number {
  const [w, h] = ar.split(":").map(Number);
  return w / h;
}
