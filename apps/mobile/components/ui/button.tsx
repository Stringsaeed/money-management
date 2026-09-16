import { TextStyleContext } from "@/components/ui/text";
import { colors, radii, shadows, spacing, typography } from "@/lib/design-tokens";
import {
  Platform,
  Pressable,
  type PressableStateCallbackType,
  StyleSheet,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type ButtonVariant = "default" | "destructive" | "secondary" | "outline" | "ghost" | "link";
type ButtonSize = "default" | "sm" | "lg" | "xl" | "fab" | "icon";

type ButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
  };

// -----------------------------------------------------------------------------
// Shadow Helpers (parse boxShadow string to RN shadow props)
// -----------------------------------------------------------------------------

type ShadowStyle = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

function parseShadow(shadow: string): ShadowStyle | Record<string, never> {
  if (shadow === "none") {
    return {};
  }
  const match = shadow.match(
    /(-?\d+)px\s+(-?\d+)px\s+(-?\d+)px\s+(?:(-?\d+)px\s+)?rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/,
  );
  if (!match) {
    return {};
  }
  const [, offsetX, offsetY, blurRadius, , r, g, b, a] = match;
  const opacity = a ? parseFloat(a) : 1;
  return {
    shadowColor: `rgb(${r}, ${g}, ${b})`,
    shadowOffset: { width: parseInt(offsetX, 10), height: parseInt(offsetY, 10) },
    shadowOpacity: opacity,
    shadowRadius: parseInt(blurRadius, 10) / 2,
    elevation: Math.max(1, Math.round(parseInt(blurRadius, 10) / 2)),
  };
}

// -----------------------------------------------------------------------------
// Variant Styles
// -----------------------------------------------------------------------------

const variantStyles = {
  default: {
    backgroundColor: colors.kumoBrandEmphasisEnd,
    borderWidth: 1,
    borderColor: "#045ede",
    ...parseShadow(shadows.sm),
  },
  destructive: {
    backgroundColor: colors.kumoDangerEmphasisEnd,
    borderWidth: 1,
    borderColor: "#da252e",
    ...parseShadow(shadows.sm),
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    ...parseShadow(shadows.sm),
  },
  outline: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    ...parseShadow(shadows.sm),
  },
  ghost: {
    backgroundColor: "transparent",
  },
  link: {
    backgroundColor: "transparent",
  },
} satisfies Record<ButtonVariant, ViewStyle>;

const variantPressedStyles = {
  default: {},
  destructive: {
    backgroundColor: "#ff7d75",
  },
  secondary: {
    opacity: 0.9,
  },
  outline: {
    backgroundColor: colors.accent,
  },
  ghost: {
    backgroundColor: colors.accent,
  },
  link: {},
} satisfies Record<ButtonVariant, ViewStyle>;

// -----------------------------------------------------------------------------
// Size Styles
// -----------------------------------------------------------------------------

const sizeStyles = {
  default: {
    height: spacing[9],
    gap: spacing[1.5],
    borderRadius: radii.lg,
    paddingHorizontal: spacing[3],
  },
  sm: {
    height: 26,
    gap: spacing[1],
    borderRadius: radii.md,
    paddingHorizontal: spacing[2],
  },
  lg: {
    height: spacing[10],
    gap: spacing[2],
    borderRadius: radii.lg,
    paddingHorizontal: spacing[4],
  },
  xl: {
    height: spacing[14],
    gap: spacing[2],
    borderRadius: radii.lg,
    paddingHorizontal: spacing[6],
  },
  fab: {
    width: spacing[14],
    height: spacing[14],
    borderRadius: radii.full,
    position: "absolute",
    bottom: spacing[8],
    right: spacing[5],
  },
  icon: {
    width: spacing[9],
    height: spacing[9],
    borderRadius: radii.lg,
    padding: 0,
  },
} satisfies Record<ButtonSize, ViewStyle>;

// -----------------------------------------------------------------------------
// Text Styles
// -----------------------------------------------------------------------------

const baseTextStyle = {
  fontFamily: typography.fontBodyMedium,
  fontSize: typography.textSm,
  lineHeight: 21,
  letterSpacing: typography.trackingNormal,
} satisfies TextStyle;

const variantTextStyles = {
  default: {
    color: colors.primaryForeground,
  },
  destructive: {
    color: "#ffffff",
  },
  secondary: {
    color: colors.secondaryForeground,
  },
  outline: {
    color: colors.foreground,
  },
  ghost: {
    color: colors.foreground,
  },
  link: {
    color: colors.primary,
  },
} satisfies Record<ButtonVariant, TextStyle>;

const variantTextPressedStyles = {
  default: {},
  destructive: {},
  secondary: {},
  outline: {
    color: colors.accentForeground,
  },
  ghost: {
    color: colors.accentForeground,
  },
  link: {
    textDecorationLine: "underline",
  },
} satisfies Record<ButtonVariant, TextStyle>;

const sizeTextStyles = {
  default: {},
  sm: {
    fontSize: typography.textXs,
  },
  lg: {},
  xl: {
    fontSize: 17,
  },
  fab: {},
  icon: {},
} satisfies Record<ButtonSize, TextStyle>;

// -----------------------------------------------------------------------------
// Base Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  base: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 0,
    ...Platform.select({
      web: {
        userSelect: "none",
      },
    }),
  },
  disabled: {
    opacity: 0.5,
  },
});

// -----------------------------------------------------------------------------
// Style Resolution Helper
// -----------------------------------------------------------------------------

type StyleResolver = (state: PressableStateCallbackType) => StyleProp<ViewStyle>;
type StyleInput = StyleProp<ViewStyle> | StyleResolver | undefined;

function isStyleFunction(input: StyleInput): input is StyleResolver {
  return input !== null && input !== undefined && input.constructor === Function;
}

function resolveStyle(
  state: PressableStateCallbackType,
  styleProp: StyleInput,
): StyleProp<ViewStyle> {
  if (isStyleFunction(styleProp)) {
    return styleProp(state);
  }
  return styleProp;
}

// -----------------------------------------------------------------------------
// Children Resolution Helper
// -----------------------------------------------------------------------------

type ChildrenInput = React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode);
type ChildrenRenderer = (state: { pressed: boolean }) => React.ReactNode;

function isChildrenFunction(input: ChildrenInput): input is ChildrenRenderer {
  return input !== null && input !== undefined && input.constructor === Function;
}

// -----------------------------------------------------------------------------
// Button Component
// -----------------------------------------------------------------------------

function Button({
  variant = "default",
  size = "default",
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      role="button"
      disabled={disabled}
      style={(state) => [
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        state.pressed && variantPressedStyles[variant],
        disabled && styles.disabled,
        resolveStyle(state, style),
      ]}
      {...props}
    >
      {({ pressed }) => (
        <TextStyleContext.Provider
          value={[
            baseTextStyle,
            variantTextStyles[variant],
            sizeTextStyles[size],
            pressed && variantTextPressedStyles[variant],
          ]}
        >
          {isChildrenFunction(children) ? children({ pressed }) : children}
        </TextStyleContext.Provider>
      )}
    </Pressable>
  );
}

export { Button };
export type { ButtonProps, ButtonSize, ButtonVariant };
