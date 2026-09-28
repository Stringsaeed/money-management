import {
  BottomSheet as NativeBottomSheet,
  BottomSheetScrollView,
} from "@expo/ui/community/bottom-sheet";
import { useState, type ReactNode } from "react";
import { StyleSheet, useColorScheme } from "react-native";

import { rawColorValues, spacing } from "./design-tokens";

export interface SheetProps {
  open: boolean;
  onDismiss: () => void;
  children: ReactNode;
  snapPoints?: ("half" | "full")[];
  testID?: string;
}

export function Sheet({
  open,
  onDismiss,
  children,
  snapPoints = ["half", "full"],
  testID,
}: SheetProps) {
  const scheme = useColorScheme();
  // Unmounting a presented native sheet tears it down mid-flight: its content disappears first and
  // an empty sheet flashes over the screen. Stay mounted with index -1 so the sheet animates out,
  // and unmount once the native dismissal has finished.
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  if (!mounted) return null;

  return (
    <NativeBottomSheet
      backgroundStyle={scheme === "dark" ? styles.nativeDark : styles.nativeLight}
      enablePanDownToClose
      index={open ? 0 : -1}
      onDismiss={() => {
        setMounted(false);
        // Still open means the user dismissed the sheet natively (swipe, backdrop).
        if (open) onDismiss();
      }}
      snapPoints={snapPoints.map((point) => (point === "half" ? "50%" : "100%"))}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        testID={testID}
      >
        {children}
      </BottomSheetScrollView>
    </NativeBottomSheet>
  );
}

const styles = StyleSheet.create({
  // Compose's scalar containerColor cannot accept opaque PlatformColor maps.
  // Keep this native-control bridge on the same canonical palette as RN tokens.
  nativeLight: { backgroundColor: rawColorValues.light.background },
  nativeDark: { backgroundColor: rawColorValues.dark.background },
  content: {
    gap: spacing[3],
    padding: spacing[4],
  },
});
