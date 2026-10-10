import { StyleSheet, View } from "react-native";

import { Text } from "../text";
import { colors, radius, space } from "../tokens";
import { useUserColor } from "./use-user-color";
import { findSwatch } from "./utils";

export interface CategoryPreviewProps {
  emoji: string;
  name: string;
  /** The user's chosen hex. */
  color?: string | null;
  /** Caption under the name. Defaults to the palette name of `color`, e.g. "Blue". */
  stamp?: string;
}

/**
 * Editor preview: a 72pt round emoji on the user's tint with a 2pt full-strength ring.
 * The name and stamp stay in text tokens; text never takes the user's colour.
 */
export function CategoryPreview({ emoji, name, color, stamp }: CategoryPreviewProps) {
  const userColor = useUserColor(color);
  const caption = stamp ?? findSwatch(color)?.name;

  return (
    <View style={styles.card}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.disc,
          {
            backgroundColor: userColor?.tint ?? colors.fill.neutral,
            borderColor: userColor?.ring ?? colors.border.strong,
          },
        ]}
      >
        <Text allowFontScaling={false} style={styles.emoji}>
          {emoji}
        </Text>
      </View>
      <Text numberOfLines={1} variant="labelMd">
        {name}
      </Text>
      {caption ? (
        <Text tone="tertiary" variant="stamp">
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.surface.default,
    borderColor: colors.border.subtle,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: space[2],
    paddingHorizontal: space[2],
    paddingVertical: space[4],
  },
  disc: {
    alignItems: "center",
    borderRadius: radius.full,
    borderWidth: 2,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  emoji: { fontSize: 36, lineHeight: 42 },
});
