import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";

interface CreateResourceSheetFooterProps {
  error?: string;
  isSubmitting: boolean;
  onSubmit: VoidFunction;
  submitLabel: string;
  submittingLabel?: string;
}

/**
 * Primary submit uses RN Pressable (not `@/components/ui/button`): agent-device
 * hit-testing still reported Create Account as hittable=false with the shared
 * Button wrapper — same miss class as pre-#253 personal-upload confirm.
 */
export function CreateResourceSheetFooter({
  error,
  isSubmitting,
  onSubmit,
  submitLabel,
  submittingLabel = "Creating…",
}: CreateResourceSheetFooterProps) {
  return (
    <View style={styles.container}>
      {error ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={layoutTransition}
        >
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        disabled={isSubmitting}
        onPress={onSubmit}
        testID="create-resource-submit"
        style={({ pressed }) => [
          styles.submitButton,
          isSubmitting && styles.submitButtonDisabled,
          pressed && !isSubmitting && styles.submitButtonPressed,
        ]}
      >
        <Text style={styles.submitLabel}>{isSubmitting ? submittingLabel : submitLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
    padding: spacing[5],
  },
  errorText: {
    textAlign: "center",
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textSm,
    color: colors.destructive,
  },
  submitButton: {
    minHeight: spacing[12],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.xl,
    backgroundColor: colors.ink,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  submitButtonPressed: {
    opacity: 0.8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitLabel: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textBase,
    color: colors.surface,
  },
});
