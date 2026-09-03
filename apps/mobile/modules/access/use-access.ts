import { createContext, useContext } from "react";

import type { AccessState } from "./types";

export const AccessContext = createContext<AccessState | null>(null);

export function useAccess(): AccessState {
  const access = useContext(AccessContext);
  if (!access) {
    throw new Error("useAccess must be used within AccessProvider");
  }
  return access;
}

export function signedInUserId(access: AccessState): string | null {
  return access.kind === "signed_in" ? access.user.userId : null;
}
