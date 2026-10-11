import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, fonts, PressableScale, radius, space, Text } from "@/ui/trove";

interface HomePlanCardProps {
  readonly onPress: () => void;
}

/** Dashed invitation shown until a budget exists: plan the month, three minutes. */
export function HomePlanCard({ onPress }: HomePlanCardProps) {
  return (
    <PressableScale
      accessibilityHint="Opens budget setup"
      accessibilityLabel="Plan your month. See what’s safe to spend until payday, about 3 minutes"
      accessibilityRole="link"
      onPress={onPress}
      style={styles.card}
    >
      <NativeText
        accessibilityElementsHidden
        allowFontScaling={false}
        importantForAccessibility="no"
        style={styles.emoji}
      >
        ✉️
      </NativeText>
      <View style={styles.copy}>
        <Text style={styles.title}>Plan your month</Text>
        <Text tone="secondary" variant="bodySm">
          See what’s safe to spend until payday · 3 min
        </Text>
      </View>
      <View style={styles.start}>
        <Text style={styles.startLabel} tone="onAccent">
          Start
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    borderStyle: "dashed",
    borderWidth: 1.5,
    flexDirection: "row",
    gap: space[3],
    paddingLeft: space[4],
    paddingRight: 14,
    paddingVertical: 14,
  },
  emoji: { fontSize: 26, lineHeight: 34 },
  copy: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.extrabold, fontSize: 16, lineHeight: 21 },
  start: {
    alignItems: "center",
    backgroundColor: colors.accent.fill,
    borderRadius: radius.full,
    height: 36,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  startLabel: { fontFamily: fonts.extrabold, fontSize: 14, lineHeight: 19 },
});
