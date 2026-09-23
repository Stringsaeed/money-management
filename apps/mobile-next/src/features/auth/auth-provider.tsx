import { createContext, useEffect, useState, type ReactNode } from "react";

import {
  claimGuest,
  continueAsGuest,
  currentGuestSession,
  currentRegisteredSession,
  hydrateAuth,
  signInWithWorkOS,
  saveGuestToAccount,
  signOut,
  subscribeAuthState,
} from "./auth-client";
import type { AuthActionResult, AuthPrincipal, SessionController } from "./auth-types";

export const AuthContext = createContext<SessionController | null>(null);

export interface AuthProviderProps {
  readonly children: ReactNode;
}

function snapshot() {
  const registered = currentRegisteredSession();
  if (registered) return { status: "signed_in" as const, principal: registered.principal };
  const guest = currentGuestSession();
  if (guest) return { status: "guest" as const, principal: guest.principal };
  return { status: "signed_out" as const, principal: null };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<SessionController["status"]>("loading");
  const [principal, setPrincipal] = useState<AuthPrincipal | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void hydrateAuth()
      .catch(() => {
        if (mounted) setError("Could not restore your session. Try signing in again.");
      })
      .finally(() => {
        if (!mounted) return;
        const next = snapshot();
        setStatus(next.status);
        setPrincipal(next.principal);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(
    () =>
      subscribeAuthState(() => {
        const next = snapshot();
        setStatus(next.status);
        setPrincipal(next.principal);
      }),
    [],
  );

  const run = async (action: () => Promise<AuthActionResult>): Promise<AuthActionResult> => {
    setError(null);
    try {
      const result = await action();
      if (result.kind === "signed_in" || result.kind === "guest") {
        setStatus(result.kind === "signed_in" ? "signed_in" : "guest");
        setPrincipal(result.principal);
      }
      if (result.kind === "failed") setError(result.message);
      return result;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "The request failed. Try again.";
      setError(message);
      return { kind: "failed", message };
    }
  };

  const controller: SessionController = {
    status,
    principal,
    error,
    signIn: () => run(signInWithWorkOS),
    continueAsGuest: () => run(continueAsGuest),
    saveGuestToAccount: () => run(saveGuestToAccount),
    claimGuest: async () => {
      const result = await claimGuest();
      const next = snapshot();
      setStatus(next.status);
      setPrincipal(next.principal);
      return result;
    },
    signOut: async () => {
      await signOut();
      setError(null);
      setStatus("signed_out");
      setPrincipal(null);
    },
  };

  return <AuthContext.Provider value={controller}>{children}</AuthContext.Provider>;
}
