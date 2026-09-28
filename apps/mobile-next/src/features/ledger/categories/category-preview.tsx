import { StyleSheet, Text as NativeText, TextInput, View } from "react-native";

import { colors, radii, spacing, typography } from "@/ui/design-tokens";

interface CategoryPreviewProps {
  readonly name: string;
  readonly color: string;
  readonly icon: string;
  readonly onNameChange: (name: string) => void;
}

/** The category as it will appear: its emoji on a tint of its color, above an inline name field. */
export function CategoryPreview({ name, color, icon, onNameChange }: CategoryPreviewProps) {
  return (
    <View style={styles.container}>
      <View
        accessibilityLabel={`Icon ${icon}`}
        accessibilityRole="image"
        // Dynamic category color from data: 20% alpha tint behind the emoji, 40% for the ring.
        style={[styles.badge, { backgroundColor: `${color}33`, borderColor: `${color}66` }]}
      >
        <NativeText style={styles.emoji}>{icon}</NativeText>
      </View>
      <TextInput
        accessibilityLabel="Category name"
        autoCapitalize="words"
        maxLength={120}
        onChangeText={onNameChange}
        placeholder="Category name"
        placeholderTextColor={colors.mutedForeground}
        returnKeyType="done"
        style={styles.name}
        submitBehavior="blurAndSubmit"
        testID="category-name-field"
        value={name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: spacing[4], paddingHorizontal: spacing[5] },
  badge: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radii["3xl"],
    borderWidth: 1,
    height: spacing[24],
    justifyContent: "center",
    width: spacing[24],
  },
  emoji: { fontSize: 48, lineHeight: 58 },
  name: {
    alignSelf: "stretch",
    color: colors.ink,
    fontFamily: typography.fontHeadingBold,
    fontSize: typography.text3xl,
    letterSpacing: typography.trackingTight,
    paddingVertical: spacing[1],
    textAlign: "center",
  },
});
