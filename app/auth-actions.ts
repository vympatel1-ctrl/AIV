"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { MOCK_SESSION_COOKIE } from "@/lib/auth/mock";

export async function signInMock() {
  const store = await cookies();
  store.set(MOCK_SESSION_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/dashboard");
}

export async function signOutMock() {
  const store = await cookies();
  store.delete(MOCK_SESSION_COOKIE);
  redirect("/");
}
