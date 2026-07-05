import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

const BEARER_TOKEN_KEY = "nexa_bearer_token";

function storeBearerToken(raw: string) {
  if (typeof window === "undefined") return;
  const dot = raw.indexOf(".");
  const token = dot > 0 ? raw.slice(0, dot) : raw;
  sessionStorage.setItem(BEARER_TOKEN_KEY, token);
}

export const authClient = createAuthClient({
  // Use the page origin in the browser so local dev / preview URLs don't
  // cross-origin POST to a baked-in production BETTER_AUTH_URL.
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  fetchOptions: {
    onSuccess: (ctx) => {
      const token = ctx.response.headers.get("set-auth-token");
      if (token) {
        storeBearerToken(token);
      }
    },
  },
  plugins: [magicLinkClient(), passkeyClient()],
});

export const {
  signIn,
  signUp,
  signOut: authSignOut,
  useSession,
} = authClient;

export function getStoredBearerToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(BEARER_TOKEN_KEY);
}

export function cacheBearerToken(raw: string) {
  storeBearerToken(raw);
}

export function clearStoredBearerToken(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(BEARER_TOKEN_KEY);
}

/** True when we have a bearer token from a recent sign-in (session hook may still be loading). */
export function hasLocalAuthSession(): boolean {
  return Boolean(getStoredBearerToken());
}

function cacheBearerFromSessionState(
  sessionState: { session?: { token?: string } } | null | undefined,
) {
  if (!sessionState?.session?.token) return;
  if (!getStoredBearerToken()) {
    storeBearerToken(sessionState.session.token);
  }
}

export async function waitForSession(maxAttempts = 20): Promise<boolean> {
  const sessionStore = authClient.$store.atoms.session;

  await sessionStore.get().refetch();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const state = sessionStore.get();
    if (state.data?.session && !state.isPending && !state.isRefetching) {
      cacheBearerFromSessionState(state.data);
      return true;
    }
    if (!state.isRefetching) {
      await sessionStore.get().refetch();
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return false;
}

export async function signOut(...args: Parameters<typeof authSignOut>) {
  clearStoredBearerToken();
  return authSignOut(...args);
}

export const requestPasswordReset = authClient.requestPasswordReset;
export const resetPassword = authClient.resetPassword;
export const sendVerificationEmail = authClient.sendVerificationEmail;
