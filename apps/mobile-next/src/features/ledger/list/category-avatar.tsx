import { StyleSheet, Text as NativeText, View } from "react-native";

import { Icon, type IconName } from "@/ui/icon";
import { colors, radii } from "@/ui/design-tokens";

interface CategoryAvatarProps {
  readonly emoji: string | null;
  readonly tint: string | null;
  readonly icon: IconName;
  readonly size?: number;
}

/** The Category's own emoji on a wash of its color; a kind icon when there is no Category. */
export function CategoryAvatar({ emoji, tint, icon, size = 40 }: CategoryAvatarProps) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size },
        // Category colors are user data, so the wash is computed rather than a token.
        tint && emoji ? { backgroundColor: `${tint}24`, borderColor: `${tint}3d` } : null,
      ]}
    >
      {emoji ? (
        <NativeText style={{ fontSize: size * 0.45 }}>{emoji}</NativeText>
      ) : (
        <Icon name={icon} size={size * 0.45} color={colors.mutedForeground} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: colors.muted,
    borderColor: colors.border,
    borderCurve: "continuous",
    borderRadius: radii.xl,
    borderWidth: 1,
    justifyContent: "center",
  },
});
