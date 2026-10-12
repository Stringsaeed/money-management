import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { SoonBadge } from "../data";
import { Icon } from "../icon";
import { Text } from "../text";
import { colors, DENSE_MAX_FONT_SCALE, space } from "../tokens";

interface SettingsRowEndProps {
  value?: string;
  trailing?: ReactNode;
  chevron: boolean;
  soon: boolean;
}

/** A settings row's right edge: a Soon badge, or the control, then the mono value and chevron. */
export function SettingsRowEnd({ value, trailing, chevron, soon }: SettingsRowEndProps) {
  // The badge pins itself to the top of its parent; the wrapper lets the row centre it.
  if (soon)
    return (
      <View>
        <SoonBadge compact />
      </View>
    );
  if (trailing) return trailing;
  if (!value && !chevron) return null;
  return (
    <View style={styles.end}>
      {value ? (
        <Text
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          numberOfLines={1}
          tone="secondary"
          variant="receipt"
        >
          {value}
        </Text>
      ) : null}
      {chevron ? <Icon color={colors.text.tertiary} name="chevron-right" size={16} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  end: { alignItems: "center", flexDirection: "row", flexShrink: 0, gap: space[2] },
});
