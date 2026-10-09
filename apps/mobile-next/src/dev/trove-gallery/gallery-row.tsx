import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { space } from "@/ui/trove";

interface GalleryRowProps {
  children: ReactNode;
}

/** Wrapping horizontal run of siblings. */
export function GalleryRow({ children }: GalleryRowProps) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[2],
  },
});
