import { Pressable, StyleSheet, Text as NativeText } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts } from "@/ui/trove";

interface SlipLinkProps {
  readonly label: string;
  /** Leading design emoji, e.g. ✨. */
  readonly emoji?: string;
  /** accent: paper.accentText ("Use suggestions") · quiet: paper.textSecondary ("Clear all"). */
  readonly tone: "accent" | "quiet";
  readonly onPress: () => void;
  readonly accessibilityHint?: string;
}

/** A Nunito 800 text link printed on a paper slip. */
export function SlipLink({ label, emoji, tone, onPress, accessibilityHint }: SlipLinkProps) {
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={12}
      onPress={onPress}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      <NativeText
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={[styles.label, tone === "accent" ? styles.accent : styles.quiet]}
      >
        {emoji ? `${emoji} ${label}` : label}
      </NativeText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.extrabold, fontSize: 14, lineHeight: 19 },
  accent: { color: colors.paper.accentText },
  quiet: { color: colors.paper.textSecondary },
  pressed: { opacity: 0.6 },
});
