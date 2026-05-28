"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

import { signInWithGoogle } from "../actions";

function GoogleIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.51 5.51 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.54-5.17 3.54-8.86Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.88-3c-1.08.73-2.45 1.17-4.06 1.17-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A11.97 11.97 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.31a7.18 7.18 0 0 1 0-4.62V6.59H1.29a12 12 0 0 0 0 10.82l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.58 1.79l3.43-3.43A11.97 11.97 0 0 0 12 0 11.97 11.97 0 0 0 1.29 6.59l4 3.1C6.23 6.86 8.88 4.75 12 4.75Z"
      />
    </svg>
  );
}

export function GoogleButton({ next }: { next?: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="next" value={next ?? ""} />
      <GoogleButtonInner />
    </form>
  );
}

function GoogleButtonInner() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      size="lg"
      className="w-full"
      disabled={pending}
    >
      <GoogleIcon />
      {pending ? "Redirecting…" : "Continue with Google"}
    </Button>
  );
}
