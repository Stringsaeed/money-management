import { StyleSheet, View } from "react-native";

import { Icon } from "../icon";
import { PressableScale } from "../pressable-scale";
import { Text } from "../text";
import { colors, fonts, radius } from "../tokens";
import {
  avatarAccessibilityLabel,
  CORNER_SIZE,
  EMOJI_FONT_SIZE,
  INITIALS_FONT_SIZE,
  type AvatarScope,
  type AvatarSize,
} from "./utils";

export interface AvatarProps {
  /** Mono initials, e.g. "AB". Ignored when `emoji` is set. */
  initials?: string;
  /** The person's own emoji; replaces the initials. */
  emoji?: string;
  /** 32 · 44 (header) · 64 (profile). */
  size?: AvatarSize;
  /** `household` adds the scope ring, tinted fill and a house corner. */
  scope?: AvatarScope;
  /** Spoken name, e.g. "Profile". Defaults to the initials. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  /** Makes the avatar a button; 32pt avatars reach 44pt with hitSlop. */
  onPress?: () => void;
  testID?: string;
}

/** Round identity chip: initials in mono or the user's emoji, with an optional household scope. */
export function Avatar({
  initials,
  emoji,
  size = 44,
  scope = "personal",
  accessibilityLabel,
  accessibilityHint,
  onPress,
  testID,
}: AvatarProps) {
  const household = scope === "household";
  const label = avatarAccessibilityLabel(accessibilityLabel, initials, scope);
  const disc = (
    <View
      style={[
        styles.disc,
        { borderRadius: radius.full, height: size, width: size },
        household ? styles.household : styles.personal,
      ]}
    >
      {emoji ? (
        <Text
          allowFontScaling={false}
          style={{ fontSize: EMOJI_FONT_SIZE[size], lineHeight: EMOJI_FONT_SIZE[size] + 4 }}
        >
          {emoji}
        </Text>
      ) : (
        <Text
          allowFontScaling={false}
          style={[styles.initials, { fontSize: INITIALS_FONT_SIZE[size] }]}
          variant="amountSm"
        >
          {initials}
        </Text>
      )}
    </View>
  );
  const body = (
    <View>
      {disc}
      {household ? (
        <View
          pointerEvents="none"
          style={[
            styles.corner,
            { borderRadius: radius.full, height: CORNER_SIZE[size], width: CORNER_SIZE[size] },
          ]}
        >
          <Icon color={colors.accent.text} name="scope-household" size={CORNER_SIZE[size] - 4} />
        </View>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <PressableScale
        accessibilityHint={accessibilityHint}
        accessibilityLabel={label}
        accessibilityRole="button"
        hitSlop={size < 44 ? (44 - size) / 2 : 0}
        onPress={onPress}
        testID={testID}
      >
        {body}
      </PressableScale>
    );
  }

  return (
    <View accessibilityLabel={label} accessibilityRole="image" accessible testID={testID}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  disc: { alignItems: "center", justifyContent: "center" },
  personal: {
    backgroundColor: colors.fill.neutral,
    borderColor: colors.border.default,
    borderWidth: 1,
  },
  household: {
    backgroundColor: colors.accent.subtle,
    borderColor: colors.accent.text,
    borderWidth: 2,
  },
  initials: { fontFamily: fonts.monoSemibold },
  corner: {
    alignItems: "center",
    backgroundColor: colors.bg.canvas,
    bottom: -4,
    justifyContent: "center",
    position: "absolute",
    right: -4,
  },
});
