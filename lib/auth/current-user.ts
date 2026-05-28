import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/database";

/**
 * Single source of truth for "who is the current user?" on the server.
 *
 * Behavior:
 *   - Reads the Supabase Auth session via the cookie-aware server client
 *     (the `proxy.ts` middleware has already refreshed it for this request).
 *   - Loads the matching `profiles` row using the service-role admin client
 *     (works even before the `auth.users` → `profiles` trigger has fired
 *     for brand-new social logins).
 *   - If anonymous, redirects to /auth/login. Callers should only invoke
 *     this from routes already gated by `proxy.ts`.
 */
export async function getCurrentUser(): Promise<{
  userId: string;
  email: string;
  name: string;
  role: "user" | "admin";
  profile: Profile;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const email = user.email ?? "";
  const fallbackName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    (email ? email.split("@")[0] : "There");

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.warn("[getCurrentUser] profile lookup failed:", error.message);
  }

  // If the trigger hasn't filled the row yet (rare race after signup),
  // create it inline so the dashboard never 500s on first paint.
  let resolved: Profile;
  if (!profile) {
    const insert = await admin
      .from("profiles")
      .insert({
        id: user.id,
        email,
        full_name: fallbackName,
        role: "user",
        credits: 200,
      })
      .select("*")
      .single();
    if (insert.data) {
      await admin.from("credit_ledger").insert({
        user_id: user.id,
        delta: 200,
        reason: "signup_bonus",
        balance_after: 200,
      });
      resolved = insert.data;
    } else {
      resolved = {
        id: user.id,
        email,
        full_name: fallbackName,
        avatar_url: null,
        role: "user",
        credits: 200,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  } else {
    resolved = profile;
  }

  return {
    userId: user.id,
    email,
    name: resolved.full_name ?? fallbackName,
    role: resolved.role,
    profile: resolved,
  };
}
