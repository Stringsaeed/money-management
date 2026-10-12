import { StyleSheet, Text as NativeText, View } from "react-native";

import { Text } from "../text";
import { colors, DENSE_MAX_FONT_SCALE, fonts, radius } from "../tokens";
import { BudgetPill } from "./budget-pill";

export interface SafeToSpendErrorProps {
  /** e.g. "Couldn't calculate right now". */
  title: string;
  /** What is safe and what happens next, e.g. "Everything you logged is saved…". */
  message: string;
  /** Default "Retry". */
  retryLabel?: string;
  onRetry: () => void;
  /** Caption above the title (default "SAFE TO SPEND"). */
  label?: string;
  testID?: string;
}

/** Budget home hero when the number can't be worked out: an honest card with a Retry pill. */
export function SafeToSpendError({
  title,
  message,
  retryLabel = "Retry",
  onRetry,
  label = "SAFE TO SPEND",
  testID,
}: SafeToSpendErrorProps) {
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={styles.card}
      testID={testID}
    >
      <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} tone="tertiary" variant="stamp">
        {label}
      </Text>
      <NativeText accessibilityRole="header" style={styles.title}>
        {title}
      </NativeText>
      <NativeText style={styles.message}>{message}</NativeText>
      <View style={styles.action}>
        <BudgetPill icon="retry" label={retryLabel} onPress={onRetry} size="lg" tone="accent" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.default,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  title: { color: colors.text.primary, fontFamily: fonts.extrabold, fontSize: 20, lineHeight: 26 },
  message: {
    color: colors.text.secondary,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
  },
  action: { alignSelf: "flex-start" },
});
