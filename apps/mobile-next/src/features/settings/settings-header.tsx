import { StyleSheet, View } from "react-native";

import { colors, Icon, layout, PressableScale, radius, space, Text } from "@/ui/trove";

interface SettingsHeaderProps {
  readonly onBack: () => void;
}

/** Board header: a ringed 44pt back disc beside the 34pt display title. */
export function SettingsHeader({ onBack }: SettingsHeaderProps) {
  return (
    <View style={styles.header}>
      <PressableScale
        accessibilityLabel="Back"
        accessibilityRole="button"
        onPress={onBack}
        pressedStyle={styles.pressed}
        style={styles.back}
      >
        <Icon name="chevron-left" size={20} />
      </PressableScale>
      <Text accessibilityRole="header" numberOfLines={1} style={styles.title} variant="display">
        Settings
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: space[3],
    paddingHorizontal: layout.screenGutter,
    paddingTop: space[3],
  },
  back: {
    alignItems: "center",
    backgroundColor: colors.fill.neutral,
    borderColor: colors.border.default,
    borderRadius: radius.full,
    borderWidth: 1,
    height: layout.minTouchTarget,
    justifyContent: "center",
    width: layout.minTouchTarget,
  },
  pressed: { backgroundColor: colors.border.default },
  title: { flex: 1 },
});
