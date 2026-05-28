"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type Props = {
  payload:
    | { kind: "pack"; packId: "spark" | "creator" | "studio" | "scale" }
    | { kind: "pro" };
  label: string;
  variant?: "ink" | "outline";
  size?: "default" | "sm" | "lg" | "xl";
  className?: string;
  disabled?: boolean;
};

export function BuyButton({
  payload,
  label,
  variant = "ink",
  size = "lg",
  className,
  disabled,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [pressed, setPressed] = useState(false);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || pending || pressed}
      onClick={() => {
        setPressed(true);
        startTransition(async () => {
          try {
            const res = await fetch("/api/stripe/checkout", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(payload),
            });
            const data = (await res.json()) as { url?: string; error?: string };
            if (!res.ok || !data.url) {
              toast.error(data.error ?? "Could not open checkout");
              setPressed(false);
              return;
            }
            window.location.href = data.url;
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Network error");
            setPressed(false);
          }
        });
      }}
    >
      {pending || pressed ? "Opening checkout…" : label}
    </Button>
  );
}

export function PortalButton({
  size = "sm",
  variant = "ghost",
}: {
  size?: "default" | "sm" | "lg";
  variant?: "outline" | "ghost" | "ink";
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            const res = await fetch("/api/stripe/portal", { method: "POST" });
            const data = (await res.json()) as { url?: string; error?: string };
            if (!res.ok || !data.url) {
              toast.error(data.error ?? "Portal unavailable");
              return;
            }
            window.location.href = data.url;
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Network error");
          }
        })
      }
    >
      {pending ? "Opening…" : "Manage billing"}
    </Button>
  );
}
