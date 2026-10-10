import { useColorMode } from "./use-color-mode";
import { resolveUserColor, type UserColor } from "./utils";

/**
 * Tint and ring for a user-chosen hex, resolved for the current paper/dark mode.
 * Null when there is no colour (or it is not a valid hex) so callers fall back to neutral.
 */
export function useUserColor(hex: string | null | undefined): UserColor | null {
  const mode = useColorMode();
  return hex ? resolveUserColor(hex, mode) : null;
}
