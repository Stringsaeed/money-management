import { use } from "react";

import { AuthContext } from "./auth-provider";
import type { SessionController } from "./auth-types";

export function useSession(): SessionController {
  const context = use(AuthContext);
  if (!context) throw new Error("useSession must be used inside AuthProvider.");
  return context;
}
