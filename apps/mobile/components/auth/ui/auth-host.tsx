import { Host } from "@expo/ui";
import { createContext, useContext, type ReactElement, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, spacing } from "@/lib/design-tokens";

import { useAuthSurface } from "./auth-surface";
import { useAuthPalette } from "./use-auth-palette";
import type { AuthPalette } from "./tokens";

const AuthPaletteContext = createContext<AuthPalette | null>(null);

// Host is not an RN view, so NativeWind className never reaches it.
const hostFill = StyleSheet.create({
  fill: { flex: 1 },
});

export function AuthHost({ children }: { readonly children: ReactNode }): ReactElement {
  const surface = useAuthSurface();
  const palette = useAuthPalette();
  const insets = useSafeAreaInsets();
  const tree = (
    <AuthPaletteContext.Provider value={palette}>{children}</AuthPaletteContext.Provider>
  );

  if (surface === "sheet") {
    return tree;
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Host style={hostFill.fill} useViewportSizeMeasurement>
        {tree}
      </Host>
    </View>
  );
}

export function useAuthPaletteContext(): AuthPalette {
  const palette = useContext(AuthPaletteContext);
  if (!palette) {
    throw new Error("Auth adapters must render inside AuthScreenShell");
  }
  return palette;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[4],
  },
});
