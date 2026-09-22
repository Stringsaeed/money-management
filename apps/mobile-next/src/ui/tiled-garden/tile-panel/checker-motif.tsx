import { StyleSheet, View } from "react-native";

import { tileForegrounds, type TileTone } from "../tile-tokens";

export interface CheckerMotifProps {
  tone: TileTone;
}

export function CheckerMotif({ tone }: CheckerMotifProps) {
  const motifColor = tileForegrounds[tone];

  return (
    <View accessibilityElementsHidden pointerEvents="none" style={styles.motif}>
      <View style={[styles.motifCell, { backgroundColor: motifColor }]} />
      <View style={[styles.motifCell, styles.motifCellOffset, { backgroundColor: motifColor }]} />
      <View style={[styles.motifCell, styles.motifCellFar, { backgroundColor: motifColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  motif: {
    flexDirection: "row",
    gap: 4,
    opacity: 0.16,
    position: "absolute",
    right: 18,
    top: 18,
  },
  motifCell: {
    borderRadius: 2,
    height: 6,
    width: 6,
  },
  motifCellFar: {
    marginTop: 10,
  },
  motifCellOffset: {
    marginTop: 5,
  },
});
