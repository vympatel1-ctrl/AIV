import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/database";

import {
  MOCK_USER_EMAIL,
  MOCK_USER_ID,
  MOCK_USER_NAME,
  requireMockSession,
} from "./mock";

/**
 * Single source of truth for "who is the current user?" on the server.
 *
 * For the MVP this returns the mock session and tries to load the matching
 * `profiles` row. If Supabase env vars aren't set or the row doesn't exist
 * yet, it returns a sensible default Profile object so the UI keeps working
 * during local dev / first deploy.
 */
export async function getCurrentUser(): Promise<{
  userId: string;
  email: string;
  name: string;
  role: "user" | "admin";
  profile: Profile;
}> {
  const session = await requireMockSession();

  const fallbackProfile: Profile = {
    id: session.userId,
    email: session.email,
    full_name: session.name,
    avatar_url: null,
    role: session.role,
    credits: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return { ...session, profile: fallbackProfile };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("*")
      .eq("id", session.userId)
      .maybeSingle();

    if (error) {
      console.warn("[getCurrentUser] profile lookup failed:", error.message);
      return { ...session, profile: fallbackProfile };
    }

    if (!data) {
      const insert = await admin
        .from("profiles")
        .insert({
          id: MOCK_USER_ID,
          email: MOCK_USER_EMAIL,
          full_name: MOCK_USER_NAME,
          role: "admin",
          credits: 250,
        })
        .select("*")
        .single();
      if (insert.data) return { ...session, profile: insert.data };
      return { ...session, profile: fallbackProfile };
    }

    return {
      ...session,
      role: data.role,
      profile: data,
    };
  } catch (err) {
    console.warn(
      "[getCurrentUser] supabase unreachable, using fallback profile:",
      err
    );
    return { ...session, profile: fallbackProfile };
  }
}
