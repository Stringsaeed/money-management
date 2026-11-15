import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts } from "@/ui/trove";

import type { HeroChipTone } from "./envelope-display";

interface HeroChipProps {
  readonly text: string;
  readonly tone: HeroChipTone;
}

/** The pace chip under the bar: ink on the lime marker, or negative on its tint. */
export function HeroChip({ text, tone }: HeroChipProps) {
  return (
    <View style={[styles.chip, tone === "ok" ? styles.ok : styles.neg]}>
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={[styles.text, tone === "ok" ? styles.okText : styles.negText]}
      >
        {text}
      </NativeText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { alignSelf: "flex-start", marginTop: 4, paddingHorizontal: 8, paddingVertical: 3 },
  ok: { backgroundColor: colors.highlight },
  neg: { backgroundColor: colors.negative.subtle },
  text: { fontFamily: fonts.monoSemibold, fontSize: 12, lineHeight: 16 },
  okText: { color: colors.paper.ink },
  negText: { color: colors.negative.text },
});
