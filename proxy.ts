/**
 * Next.js 16 Proxy (formerly Middleware).
 *
 * Two jobs:
 *   1. Refresh the Supabase Auth session on every matched request so that
 *      Server Components downstream see a fresh access token. Server
 *      Components can't write cookies, so this has to happen here.
 *   2. Gate the authenticated app routes — redirect anonymous visitors
 *      hitting /dashboard, /studio/*, /projects, etc. to /auth/login.
 *
 * IMPORTANT: the matcher excludes /api/stripe/webhook so Stripe's signed
 * POSTs are never rewritten or cookie-touched.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/studio",
  "/projects",
  "/library",
  "/brand-kits",
  "/billing",
  "/settings",
  "/admin",
];

const AUTH_PAGES = new Set(["/auth/login", "/auth/signup"]);

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured yet (e.g. local first boot), don't crash.
  if (!supabaseUrl || !supabaseAnon) return response;

  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Signed-in users hitting /auth/login or /auth/signup should bounce to
  // the dashboard rather than seeing the form again.
  if (user && AUTH_PAGES.has(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Match everything except static assets, the Stripe webhook (raw body!),
  // the OAuth callback (it sets its own cookies via exchangeCodeForSession),
  // and Next image optimisation.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon|opengraph-image|twitter-image|auth/callback|api/stripe/webhook).*)",
  ],
};
