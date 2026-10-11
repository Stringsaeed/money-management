import { StyleSheet } from "react-native";

import { Text } from "../text";
import { DENSE_MAX_FONT_SCALE } from "../tokens";

interface OptionTileGridBodyProps {
  emoji: string;
  name: string;
  selected: boolean;
}

/** Emoji over a one-line label. */
export function OptionTileGridBody({ emoji, name, selected }: OptionTileGridBodyProps) {
  return (
    <>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        numberOfLines={1}
        tone={selected ? "onAccent" : "primary"}
        variant="labelSm"
      >
        {name}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  emoji: { fontSize: 26, lineHeight: 32 },
});
