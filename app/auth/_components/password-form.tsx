"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  signInWithPassword,
  signUpWithPassword,
  type AuthActionState,
} from "../actions";

type Mode = "signin" | "signup";

const INITIAL: AuthActionState = { ok: false };

export function PasswordForm({
  mode,
  next,
}: {
  mode: Mode;
  next?: string;
}) {
  const action = mode === "signup" ? signUpWithPassword : signInWithPassword;
  const [state, formAction] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next ?? ""} />

      {mode === "signup" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Sasha Chen"
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete={mode === "signup" ? "email" : "username"}
          placeholder="you@studio.com"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={mode === "signup" ? 8 : 1}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          placeholder={mode === "signup" ? "At least 8 characters" : ""}
        />
      </div>

      {state.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && state.message && (
        <p className="text-sm text-foreground/80" role="status">
          {state.message}
        </p>
      )}

      <SubmitButton mode={mode} />
    </form>
  );
}

function SubmitButton({ mode }: { mode: Mode }) {
  const { pending } = useFormStatus();
  const label =
    mode === "signup"
      ? pending
        ? "Creating account…"
        : "Create account"
      : pending
      ? "Signing in…"
      : "Sign in";
  return (
    <Button type="submit" variant="ink" size="lg" disabled={pending}>
      {label}
    </Button>
  );
}
