import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * OAuth + email-confirmation landing pad.
 *
 * Supabase Auth (Google sign-in, email magic links, and password recovery
 * all use the same flow) redirects users here with a `code` query param.
 * We exchange it for a session (which writes the auth cookies) and bounce
 * to the originally requested destination.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const errorParam = searchParams.get("error_description") ?? searchParams.get("error");

  if (errorParam) {
    const url = new URL("/auth/login", origin);
    url.searchParams.set("error", errorParam);
    return NextResponse.redirect(url);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login", origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const url = new URL("/auth/login", origin);
    url.searchParams.set("error", error.message);
    return NextResponse.redirect(url);
  }

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return NextResponse.redirect(new URL(safeNext, origin));
}
