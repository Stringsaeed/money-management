import { createContext, useContext, type ReactElement, type ReactNode } from "react";

export type AuthSurface = "sheet" | "screen";

export interface AuthSurfaceProviderProps {
  readonly surface: AuthSurface;
  readonly children: ReactNode;
}

const AuthSurfaceContext = createContext<AuthSurface>("screen");

export function AuthSurfaceProvider({ surface, children }: AuthSurfaceProviderProps): ReactElement {
  return <AuthSurfaceContext.Provider value={surface}>{children}</AuthSurfaceContext.Provider>;
}

export function useAuthSurface(): AuthSurface {
  return useContext(AuthSurfaceContext);
}
