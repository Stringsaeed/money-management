import { useColorScheme } from "react-native";
import { useNativeVariable } from "react-native-css/native";

import {
  AUTH_FALLBACK_PALETTE,
  normalizeColor,
  type AuthPalette,
  type AuthTokenName,
} from "./tokens";

function useAuthToken(name: AuthTokenName, fallback: string): string {
  return normalizeColor(`${useNativeVariable(name) ?? ""}`, fallback);
}

export function useAuthPalette(): AuthPalette {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const fallback = AUTH_FALLBACK_PALETTE[scheme];
  const ink = useAuthToken("--color-ink", fallback["--color-ink"]);
  const foreground = useAuthToken("--color-foreground", fallback["--color-foreground"]);
  const background = useAuthToken("--color-background", fallback["--color-background"]);
  const surface = useAuthToken("--color-surface", fallback["--color-surface"]);
  const input = useAuthToken("--color-input", fallback["--color-input"]);
  const border = useAuthToken("--color-border", fallback["--color-border"]);
  const mutedForeground = useAuthToken(
    "--color-muted-foreground",
    fallback["--color-muted-foreground"],
  );
  const sage = useAuthToken("--color-sage", fallback["--color-sage"]);
  const destructive = useAuthToken("--color-destructive", fallback["--color-destructive"]);
  const emphasisStart = useAuthToken(
    "--color-kumo-brand-emphasis-start",
    fallback["--color-kumo-brand-emphasis-start"],
  );
  const emphasisEnd = useAuthToken(
    "--color-kumo-brand-emphasis-end",
    fallback["--color-kumo-brand-emphasis-end"],
  );

  return {
    "--color-ink": ink,
    "--color-foreground": foreground,
    "--color-background": background,
    "--color-surface": surface,
    "--color-input": input,
    "--color-border": border,
    "--color-muted-foreground": mutedForeground,
    "--color-sage": sage,
    "--color-destructive": destructive,
    "--color-kumo-brand-emphasis-start": emphasisStart,
    "--color-kumo-brand-emphasis-end": emphasisEnd,
    kumoRing: fallback.kumoRing,
    scheme,
  };
}
