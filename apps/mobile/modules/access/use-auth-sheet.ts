import { createContext, useContext } from "react";

import type { PresentAuthSheetInput } from "./auth-sheet-session";

export interface AuthSheetApi {
  readonly presentAuthSheet: (input: PresentAuthSheetInput) => void;
}

export const AuthSheetContext = createContext<AuthSheetApi | null>(null);

export function usePresentAuthSheet(): AuthSheetApi["presentAuthSheet"] {
  const api = useContext(AuthSheetContext);
  if (!api) {
    throw new Error("usePresentAuthSheet must be used within AccessProvider");
  }
  return api.presentAuthSheet;
}
