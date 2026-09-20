import { StyleSheet, View } from "react-native";
import { FadeIn, FadeOut } from "react-native-reanimated";
import { PressableScale } from "pressto";

import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";

interface BreadcrumbSegmentProps {
  emoji: string;
  label: string;
  active?: boolean;
  onPress?: VoidFunction;
}

export function BreadcrumbSegment({ emoji, label, active, onPress }: BreadcrumbSegmentProps) {
  return (
    <PressableScale onPress={onPress} entering={FadeIn} exiting={FadeOut}>
      <View style={styles.container}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text
          style={[styles.label, active ? styles.labelActive : styles.labelInactive]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1.5],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
  },
  emoji: {
    fontSize: typography.textSm,
  },
  label: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
  },
  labelActive: {
    color: colors.ink,
  },
  labelInactive: {
    color: colors.ink,
    opacity: 0.35,
  },
});
