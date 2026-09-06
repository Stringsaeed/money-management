import { useColorScheme } from "react-native";

import { AUTH_FALLBACK_PALETTE, type AuthPalette } from "./tokens";

export function useAuthPalette(): AuthPalette {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  return AUTH_FALLBACK_PALETTE[scheme];
}
