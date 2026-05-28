import Link from "next/link";

import { Separator } from "@/components/ui/separator";

import { GoogleButton } from "../_components/google-button";
import { PasswordForm } from "../_components/password-form";

type SP = { error?: string; next?: string };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { error, next } = await searchParams;

  return (
    <div className="flex flex-col gap-7 rounded-2xl border border-foreground/10 bg-card p-8 editorial-shadow">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="font-display text-3xl tracking-tight">
          Start shipping <span className="italic ink-text">on-brand</span> video.
        </h1>
        <p className="text-sm text-muted-foreground">
          200 free credits on the house — enough to try every studio.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <GoogleButton next={next} />

      <div className="relative">
        <Separator />
        <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Or with email
        </span>
      </div>

      <PasswordForm mode="signup" next={next} />

      <p className="text-center text-xs text-muted-foreground">
        By creating an account you agree to our Terms and Privacy Policy.
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/auth/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
