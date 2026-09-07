"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

// Replaces the old Better Auth-based lib/auth-client.ts. Convex's hand-rolled single-owner
// auth (convex/auth.ts) has no ambient cookie session the way Better Auth did — the client
// is responsible for holding onto the session token and passing it explicitly on every
// authenticated call. localStorage is the storage location convex/lib/session.ts's own
// doc comment anticipates.

const STORAGE_KEY = "nexa_session_token";

interface SessionContextValue {
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (password: string, totpCode: string) => Promise<void>;
  loginWithRecoveryCode: (recoveryCode: string) => Promise<{ remainingRecoveryCodes: number }>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      setToken(localStorage.getItem(STORAGE_KEY));
    } catch {
      // localStorage unavailable (SSR, privacy mode) — treat as logged out.
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginAction = useAction(api.auth.login);
  const recoveryAction = useAction(api.auth.loginWithRecoveryCode);
  const logoutMutation = useMutation(api.auth.logout);

  const persistToken = useCallback((next: string | null) => {
    setToken(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, next);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const login = useCallback(
    async (password: string, totpCode: string) => {
      const result = await loginAction({ password, totpCode });
      persistToken(result.token);
    },
    [loginAction, persistToken],
  );

  const loginWithRecoveryCode = useCallback(
    async (recoveryCode: string) => {
      const result = await recoveryAction({ recoveryCode });
      persistToken(result.token);
      return { remainingRecoveryCodes: result.remainingRecoveryCodes };
    },
    [recoveryAction, persistToken],
  );

  const logout = useCallback(async () => {
    if (token) {
      try {
        await logoutMutation({ sessionToken: token });
      } catch {
        // best-effort — clear local state regardless
      }
    }
    persistToken(null);
  }, [token, logoutMutation, persistToken]);

  const value = useMemo<SessionContextValue>(
    () => ({ token, isLoading, isAuthenticated: Boolean(token), login, loginWithRecoveryCode, logout }),
    [token, isLoading, login, loginWithRecoveryCode, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
