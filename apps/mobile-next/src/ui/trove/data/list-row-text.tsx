import { StyleSheet, View } from "react-native";

import { Text, type TextTone } from "../text";
import { DENSE_MAX_FONT_SCALE, space } from "../tokens";

interface ListRowTextProps {
  title: string;
  subtitle?: string;
  tone: TextTone;
}

/** A list row's title and optional subtitle. */
export function ListRowText({ title, subtitle, tone }: ListRowTextProps) {
  return (
    <View style={styles.text}>
      <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone={tone} variant="labelMd">
        {title}
      </Text>
      {subtitle ? (
        <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone="secondary" variant="bodySm">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    flex: 1,
    gap: space[0.5],
    minWidth: 0,
  },
});
