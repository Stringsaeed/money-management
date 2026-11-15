import {
  BottomSheet as NativeBottomSheet,
  BottomSheetScrollView,
} from "@expo/ui/community/bottom-sheet";
import { useState, type ReactNode } from "react";
import { StyleSheet, useColorScheme } from "react-native";

import { Text } from "../text";
import { space } from "../tokens";
import { sheetBackground, type SheetSurface } from "./utils";

export interface SheetProps {
  open: boolean;
  onDismiss: () => void;
  title?: string;
  children: ReactNode;
  snapPoints?: ("half" | "full")[];
  /** `raised` (default) lifts off the screen; `canvas` matches the page, so paper slips show. */
  surface?: SheetSurface;
  testID?: string;
}

/**
 * Bottom sheet on the platform's native sheet (same approach as the legacy sheet): the
 * system supplies the grabber, top corner radius, scrim and elevation, and we paint it with
 * `surface.raised` (or `bg.canvas`). Stays mounted while the native dismissal animates out.
 */
export function Sheet({
  open,
  onDismiss,
  title,
  children,
  snapPoints = ["half", "full"],
  surface = "raised",
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
      // Native sheet backgrounds reject opaque dynamic colors; bridge the canonical raw palette.
      backgroundStyle={BACKGROUND[surface][scheme === "dark" ? "dark" : "light"]}
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
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.content}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        testID={testID}
      >
        {title ? (
          <Text accessibilityRole="header" variant="titleMd">
            {title}
          </Text>
        ) : null}
        {children}
      </BottomSheetScrollView>
    </NativeBottomSheet>
  );
}

const backgrounds = StyleSheet.create({
  raisedLight: { backgroundColor: sheetBackground("raised", "light") },
  raisedDark: { backgroundColor: sheetBackground("raised", "dark") },
  canvasLight: { backgroundColor: sheetBackground("canvas", "light") },
  canvasDark: { backgroundColor: sheetBackground("canvas", "dark") },
});

const BACKGROUND = {
  raised: { light: backgrounds.raisedLight, dark: backgrounds.raisedDark },
  canvas: { light: backgrounds.canvasLight, dark: backgrounds.canvasDark },
} as const;

const styles = StyleSheet.create({
  content: {
    gap: space[4],
    paddingBottom: space[6],
    paddingHorizontal: space[5],
    paddingTop: space[2],
  },
});
