import type { ReactNode } from "react";
import { StyleSheet, type TextStyle, View } from "react-native";

import { inputTextStyle } from "@/components/ui/input-style";
import { Text } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";

export { inputTextStyle };

/** Shared text-input chrome for resource forms (accounts, categories, envelopes). */
export const resourceInputStyle = {
  borderRadius: radii["2xl"],
  borderWidth: 1,
  borderColor: colors.ledgerOutline,
  backgroundColor: colors.surface,
  paddingHorizontal: spacing[4],
  paddingVertical: spacing[3],
  fontSize: typography.textBase,
  lineHeight: 20,
  color: colors.ink,
} as const satisfies TextStyle;

interface ResourceFormFieldProps {
  children: ReactNode;
  error?: unknown;
  label: string;
}

export function ResourceFormField({ children, error, label }: ResourceFormFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.errorText}>{String(error)}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing[2],
  },
  label: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.6,
  },
  errorText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textXs,
    color: colors.destructive,
  },
});
