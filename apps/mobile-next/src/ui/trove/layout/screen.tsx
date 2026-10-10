import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { colors } from "../tokens";

export interface ScreenProps {
  children: ReactNode;
  /**
   * Vertical safe-area edges to inset. Tab screens usually take `["top"]`; the floating tab bar
   * owns the bottom. Left and right are always inset (landscape notches, side status areas).
   */
  edges?: readonly Edge[];
  style?: StyleProp<ViewStyle>;
}

/** Screen root: bg.canvas behind the whole screen, content inset from the chosen safe-area edges. */
const SIDE_EDGES: readonly Edge[] = ["left", "right"];

export function Screen({ children, edges = ["top", "bottom"], style }: ScreenProps) {
  const insetEdges = [...new Set([...edges, ...SIDE_EDGES])];
  return (
    <SafeAreaView edges={insetEdges} style={styles.safeArea}>
      <View style={[styles.content, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.bg.canvas, flex: 1 },
  content: { flex: 1 },
});
