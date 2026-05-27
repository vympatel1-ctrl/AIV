import { createClient as createServiceRoleClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Service-role Supabase client. Bypasses RLS — only use server-side.
 * Used for admin operations and for the mock-auth flow where there is
 * no real auth.uid() yet.
 */
export function createAdminClient() {
  return createServiceRoleClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
