import { TextStyleContext } from "@/components/ui/text";
import { colors, radii, spacing, typography } from "@/lib/design-tokens";
import * as Slot from "@rn-primitives/slot";
import {
  StyleSheet,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
  View,
  type ViewProps,
} from "react-native";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

type BadgeProps = ViewProps &
  React.RefAttributes<View> & {
    variant?: BadgeVariant;
    asChild?: boolean;
  };

// -----------------------------------------------------------------------------
// Variant Styles
// -----------------------------------------------------------------------------

const variantStyles = {
  default: {
    backgroundColor: colors.primary,
    borderColor: "transparent",
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderColor: "transparent",
  },
  destructive: {
    backgroundColor: colors.destructive,
    borderColor: "transparent",
  },
  outline: {
    backgroundColor: "transparent",
    borderColor: colors.border,
  },
} satisfies Record<BadgeVariant, ViewStyle>;

// -----------------------------------------------------------------------------
// Text Styles
// -----------------------------------------------------------------------------

const baseTextStyle = {
  fontFamily: typography.fontBodyMedium,
  fontSize: typography.textXs,
} satisfies TextStyle;

const variantTextStyles = {
  default: {
    color: colors.primaryForeground,
  },
  secondary: {
    color: colors.secondaryForeground,
  },
  destructive: {
    color: "#ffffff",
  },
  outline: {
    color: colors.foreground,
  },
} satisfies Record<BadgeVariant, TextStyle>;

// -----------------------------------------------------------------------------
// Base Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  base: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[1],
    overflow: "hidden",
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
  },
});

// -----------------------------------------------------------------------------
// Badge Component
// -----------------------------------------------------------------------------

function Badge({ variant = "default", asChild, style, children, ...props }: BadgeProps) {
  const Component = asChild ? Slot.View : View;

  const containerStyle: StyleProp<ViewStyle> = [styles.base, variantStyles[variant], style];
  const textStyle: StyleProp<TextStyle> = [baseTextStyle, variantTextStyles[variant]];

  return (
    <TextStyleContext.Provider value={textStyle}>
      <Component style={containerStyle} {...props}>
        {children}
      </Component>
    </TextStyleContext.Provider>
  );
}

export { Badge };
export type { BadgeProps, BadgeVariant };
