import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts } from "@/ui/trove";

import { wholeAmount } from "./home-money";

interface HomeDeltaMarkerProps {
  readonly deltaMinor: number;
  readonly currency: string;
}

/** Highlighter stamp for the month's change: lime for a rise, a quiet fill for a fall. */
export function HomeDeltaMarker({ deltaMinor, currency }: HomeDeltaMarkerProps) {
  const up = deltaMinor > 0;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.marker, up ? styles.up : styles.down]}
    >
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={[styles.label, up ? styles.upLabel : styles.downLabel]}
      >
        {`${up ? "▲" : "▼"} ${wholeAmount(deltaMinor, currency)}`}
      </NativeText>
    </View>
  );
}

const styles = StyleSheet.create({
  marker: { marginLeft: "auto", paddingHorizontal: 8, paddingVertical: 2 },
  up: { backgroundColor: colors.highlight },
  down: { backgroundColor: colors.fill.neutral },
  label: { fontFamily: fonts.monoSemibold, fontSize: 12, lineHeight: 16 },
  upLabel: { color: colors.paper.ink },
  downLabel: { color: colors.text.secondary },
});
