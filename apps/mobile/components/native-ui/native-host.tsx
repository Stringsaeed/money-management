import { Host } from "@expo/ui";
import { createContext, useContext, type ReactElement, type ReactNode } from "react";
import { StyleSheet } from "react-native";

import { useAuthPalette } from "@/components/auth/ui/use-auth-palette";
import type { AuthPalette } from "@/components/auth/ui/tokens";

const NativePaletteContext = createContext<AuthPalette | null>(null);

const hostFill = StyleSheet.create({
  fillWidth: { alignSelf: "stretch", width: "100%" },
  hug: { alignSelf: "flex-start" },
});

export interface NativeHostProps {
  readonly children: ReactNode;
  /** Stretch to the parent width (form CTAs). Default true. */
  readonly fillWidth?: boolean;
}

/**
 * Host boundary for Paper Ledger native buttons inside RN layout trees
 * (cards, ScrollView). Uses matchContents so the host hugs control height.
 */
export function NativeHost({ children, fillWidth = true }: NativeHostProps): ReactElement {
  const palette = useAuthPalette();
  return (
    <NativePaletteContext.Provider value={palette}>
      <Host
        style={fillWidth ? hostFill.fillWidth : hostFill.hug}
        matchContents={{ vertical: true, horizontal: !fillWidth }}
      >
        {children}
      </Host>
    </NativePaletteContext.Provider>
  );
}

export function useNativePaletteContext(): AuthPalette {
  const palette = useContext(NativePaletteContext);
  if (!palette) {
    throw new Error("Native buttons must render inside NativeHost");
  }
  return palette;
}
