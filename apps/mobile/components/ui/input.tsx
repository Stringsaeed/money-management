import { colors, radii, shadows, spacing, typography } from "@/lib/design-tokens";
import { StyleSheet, TextInput, type StyleProp, type TextStyle } from "react-native";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type InputProps = React.ComponentProps<typeof TextInput> &
  React.RefAttributes<TextInput> & {
    style?: StyleProp<TextStyle>;
  };

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  base: {
    height: spacing[10],
    width: "100%",
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.input,
    backgroundColor: colors.background,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    fontSize: typography.textBase,
    lineHeight: 20,
    color: colors.foreground,
    boxShadow: shadows.sm,
  },
  disabled: {
    opacity: 0.5,
  },
});

// -----------------------------------------------------------------------------
// Input Component
// -----------------------------------------------------------------------------

function Input({ style, editable, ...props }: InputProps) {
  return (
    <TextInput
      style={[styles.base, editable === false && styles.disabled, style]}
      placeholderTextColor={colors.mutedForeground}
      editable={editable}
      {...props}
    />
  );
}

export { Input };
export type { InputProps };
