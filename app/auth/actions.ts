"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function originFromHeaders(headerList: Headers): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

/**
 * Result type for signup/login server actions. `useActionState`-friendly.
 */
export type AuthActionState = {
  ok: boolean;
  error?: string;
  message?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readFormFields(form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const name = String(form.get("name") ?? "").trim();
  const next = String(form.get("next") ?? "").trim();
  return { email, password, name, next };
}

export async function signUpWithPassword(
  _prev: AuthActionState | undefined,
  form: FormData
): Promise<AuthActionState> {
  const { email, password, name, next } = readFormFields(form);
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const headerList = await headers();
  const origin = originFromHeaders(headerList);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name || email.split("@")[0] },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
        next || "/dashboard"
      )}`,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  // If email confirmations are off and a session was returned immediately,
  // bounce straight into the app.
  if (data.session) {
    redirect(next || "/dashboard");
  }

  return {
    ok: true,
    message:
      "Check your inbox to confirm your email. You can close this tab once verified.",
  };
}

export async function signInWithPassword(
  _prev: AuthActionState | undefined,
  form: FormData
): Promise<AuthActionState> {
  const { email, password, next } = readFormFields(form);
  if (!EMAIL_RE.test(email) || password.length < 1) {
    return { ok: false, error: "Email and password are required." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  redirect(next || "/dashboard");
}

/**
 * Kicks off the Google OAuth round-trip. Supabase returns a `url` to send
 * the user to; we redirect there.
 */
export async function signInWithGoogle(form: FormData): Promise<void> {
  const next = String(form.get("next") ?? "").trim() || "/dashboard";
  const supabase = await createClient();
  const headerList = await headers();
  const origin = originFromHeaders(headerList);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data?.url) {
    redirect(
      `/auth/login?error=${encodeURIComponent(
        error?.message ?? "Could not start Google sign-in"
      )}`
    );
  }

  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
