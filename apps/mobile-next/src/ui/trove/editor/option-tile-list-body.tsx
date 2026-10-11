import { StyleSheet, View } from "react-native";

import { Icon } from "../icon";
import { Text } from "../text";
import { colors, DENSE_MAX_FONT_SCALE, fonts } from "../tokens";

interface OptionTileListBodyProps {
  emoji: string;
  name: string;
  subtitle?: string;
  selected: boolean;
}

/** Emoji, name over a mono subtitle, trailing check when selected. */
export function OptionTileListBody({ emoji, name, subtitle, selected }: OptionTileListBodyProps) {
  const tone = selected ? "onAccent" : "primary";
  return (
    <>
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={styles.copy}>
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone={tone} variant="titleSm">
          {name}
        </Text>
        {subtitle ? (
          <Text
            maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
            style={styles.subtitle}
            tone={tone}
            variant="receipt"
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {selected ? <Icon color={colors.accent.on} name="check" size={20} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  copy: { flex: 1 },
  emoji: { fontSize: 24, lineHeight: 30 },
  subtitle: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 16,
    opacity: 0.8,
  },
});
