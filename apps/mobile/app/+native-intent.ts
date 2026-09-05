import { logAuthLink } from "@/modules/access/auth-link-debug";
import { isAuthCarrierPath } from "@/modules/access/links";

interface RedirectSystemPathInput {
  readonly path: string;
  readonly initial: boolean;
}

export function redirectSystemPath({ path, initial }: RedirectSystemPathInput): string | null {
  try {
    const carrier = isAuthCarrierPath(path);
    logAuthLink("native-intent", {
      path,
      initial: initial ? "true" : "false",
      carrier: carrier ? "true" : "false",
      action: carrier ? "suppress" : "pass",
    });
    return carrier ? null : path;
  } catch (error) {
    logAuthLink("native-intent.error", {
      path,
      initial: initial ? "true" : "false",
      message: error instanceof Error ? error.message : "unknown",
    });
    return path;
  }
}
