import { Host } from "@expo/ui";
import { createContext, useContext, type ReactElement, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

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
  const tree = (
    <AuthPaletteContext.Provider value={palette}>{children}</AuthPaletteContext.Provider>
  );

  if (surface === "sheet") {
    return tree;
  }

  return (
    <View className="flex-1 bg-surface pt-safe pb-safe px-4">
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
