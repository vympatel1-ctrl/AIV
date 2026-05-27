/**
 * Mock auth for the MVP.
 *
 * The landing page's "Sign In" button calls `signInMock()` (a server action)
 * which sets a cookie marking the session as active, then redirects to
 * `/dashboard`. Server code reads the cookie + falls back to the env var.
 *
 * TODO(auth): replace with Supabase Auth (email/magic-link) before launch.
 */
import { cookies } from "next/headers";

export const MOCK_USER_ID =
  process.env.MOCK_USER_ID ?? "00000000-0000-0000-0000-000000000001";
export const MOCK_USER_EMAIL =
  process.env.MOCK_USER_EMAIL ?? "demo@aiv.app";
export const MOCK_USER_NAME = "Demo Founder";
export const MOCK_SESSION_COOKIE = "aiv_mock_session";

export type MockSession = {
  userId: string;
  email: string;
  name: string;
  role: "user" | "admin";
};

export async function getMockSession(): Promise<MockSession | null> {
  const store = await cookies();
  const cookie = store.get(MOCK_SESSION_COOKIE);
  if (!cookie?.value) return null;
  return {
    userId: MOCK_USER_ID,
    email: MOCK_USER_EMAIL,
    name: MOCK_USER_NAME,
    role: "admin",
  };
}

export async function requireMockSession(): Promise<MockSession> {
  const session = await getMockSession();
  if (!session) {
    return {
      userId: MOCK_USER_ID,
      email: MOCK_USER_EMAIL,
      name: MOCK_USER_NAME,
      role: "admin",
    };
  }
  return session;
}
