import { colors, radii, spacing, typography } from "@/lib/design-tokens";
import * as Slot from "@rn-primitives/slot";
import * as React from "react";
import {
  StyleSheet,
  Text as RNText,
  type Role,
  type StyleProp,
  type TextStyle,
} from "react-native";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type TextVariant =
  | "default"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "p"
  | "blockquote"
  | "code"
  | "lead"
  | "large"
  | "small"
  | "muted";

type TextProps = React.ComponentProps<typeof RNText> &
  React.RefAttributes<RNText> & {
    variant?: TextVariant;
    asChild?: boolean;
  };

// -----------------------------------------------------------------------------
// Accessibility Mappings
// -----------------------------------------------------------------------------

type HeadingVariant = "h1" | "h2" | "h3" | "h4";

const HEADING_ROLE = {
  h1: "heading",
  h2: "heading",
  h3: "heading",
  h4: "heading",
} as const satisfies Record<HeadingVariant, Role>;

const HEADING_ARIA_LEVEL = {
  h1: "1",
  h2: "2",
  h3: "3",
  h4: "4",
} as const satisfies Record<HeadingVariant, string>;

function isHeadingVariant(variant: TextVariant): variant is HeadingVariant {
  return variant === "h1" || variant === "h2" || variant === "h3" || variant === "h4";
}

// -----------------------------------------------------------------------------
// Variant Styles
// -----------------------------------------------------------------------------

const variantStyles = {
  default: {
    fontFamily: typography.fontBodyNormal,
  },
  h1: {
    textAlign: "center",
    fontSize: typography.text4xl,
    fontFamily: typography.fontBodyBlack,
    letterSpacing: typography.trackingTight,
  },
  h2: {
    fontSize: typography.text3xl,
    fontFamily: typography.fontBodySemibold,
    letterSpacing: typography.trackingTight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing[2],
  },
  h3: {
    fontSize: typography.text2xl,
    fontFamily: typography.fontBodySemibold,
    letterSpacing: typography.trackingTight,
  },
  h4: {
    fontSize: typography.textXl,
    fontFamily: typography.fontBodySemibold,
    letterSpacing: typography.trackingTight,
  },
  p: {
    marginTop: spacing[3],
    lineHeight: 28,
  },
  blockquote: {
    marginTop: spacing[4],
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    paddingLeft: spacing[3],
    fontStyle: "italic",
  },
  code: {
    backgroundColor: colors.muted,
    borderRadius: radii.sm,
    paddingHorizontal: 5,
    paddingVertical: 3,
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
  },
  lead: {
    color: colors.mutedForeground,
    fontSize: typography.textXl,
  },
  large: {
    fontSize: typography.textLg,
    fontFamily: typography.fontBodySemibold,
  },
  small: {
    fontSize: typography.textSm,
    fontFamily: typography.fontBodyMedium,
    lineHeight: typography.textSm,
  },
  muted: {
    color: colors.mutedForeground,
    fontSize: typography.textSm,
  },
} satisfies Record<TextVariant, TextStyle>;

// -----------------------------------------------------------------------------
// Base Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  base: {
    color: colors.foreground,
    fontSize: typography.textBase,
  },
});

// -----------------------------------------------------------------------------
// Context for Parent Style Inheritance
// -----------------------------------------------------------------------------

const TextClassContext = React.createContext<string | undefined>(undefined);
const TextStyleContext = React.createContext<StyleProp<TextStyle> | undefined>(undefined);

// -----------------------------------------------------------------------------
// Text Component
// -----------------------------------------------------------------------------

function Text({ style, asChild = false, variant = "default", ...props }: TextProps) {
  const textStyle = React.useContext(TextStyleContext);
  const Component = asChild ? Slot.Text : RNText;

  const isHeading = isHeadingVariant(variant);

  return (
    <Component
      style={[styles.base, variantStyles[variant], textStyle, style]}
      role={isHeading ? HEADING_ROLE[variant] : undefined}
      aria-level={isHeading ? HEADING_ARIA_LEVEL[variant] : undefined}
      {...props}
    />
  );
}

export { Text, TextClassContext, TextStyleContext };
export type { TextProps, TextVariant };
