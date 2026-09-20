import { TextStyleContext } from "@/components/ui/text";
import { colors } from "@/lib/design-tokens";
import type { Icon as PhosphorIcon, IconProps as PhosphorIconProps } from "phosphor-react-native";
import * as React from "react";
import { StyleSheet, type StyleProp, type TextStyle } from "react-native";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type IconProps = Omit<PhosphorIconProps, "color"> & {
  as: PhosphorIcon;
  style?: StyleProp<TextStyle>;
  /**
   * @deprecated Use `style` prop with design tokens instead.
   * This prop exists for backward compatibility with NativeWind consumers.
   * NativeWind transforms className → style at compile time.
   */
  className?: string;
};

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  default: {
    color: colors.foreground,
  },
});

// -----------------------------------------------------------------------------
// Color Extraction Helper
// -----------------------------------------------------------------------------

/**
 * Extracts the color value from a flattened style array.
 * Returns the last defined color string found in the style chain.
 *
 * Note: Phosphor icons only accept string colors, not ColorValue/OpaqueColorValue.
 * When using design tokens (which return dynamic colors), pass the color directly
 * via style prop with a hex string, or the icon will fall back to the default color.
 */
function extractColor(styleProp: StyleProp<TextStyle>): string | undefined {
  if (!styleProp) return undefined;

  const flatStyles = StyleSheet.flatten(styleProp);
  const colorValue = flatStyles?.color;

  // SAFETY: Phosphor icons require string colors. React Native's ColorValue
  // type includes OpaqueColorValue (from DynamicColorIOS/PlatformColor) which
  // cannot be used with Phosphor. We filter for string colors only.
  // oxlint-disable-next-line anti-slop/no-runtime-typeof
  if (typeof colorValue === "string") {
    return colorValue;
  }

  return undefined;
}

// -----------------------------------------------------------------------------
// Icon Component
// -----------------------------------------------------------------------------

/**
 * A wrapper component for Phosphor icons with StyleSheet support.
 *
 * This component allows you to render any Phosphor icon while applying styles
 * using React Native StyleSheet. It inherits text color from parent components
 * via TextStyleContext (e.g., when used inside Button or Badge).
 *
 * @component
 * @example
 * ```tsx
 * import { XIcon } from 'phosphor-react-native';
 * import { Icon } from '@/components/ui/icon';
 * import { colors } from '@/lib/design-tokens';
 *
 * <Icon as={XIcon} style={{ color: colors.destructive }} size={16} />
 * ```
 *
 * @param {PhosphorIcon} as - The Phosphor icon component to render.
 * @param {StyleProp<TextStyle>} style - Style object to apply to the icon.
 * @param {number} size - Icon size (defaults to 14).
 * @param {...PhosphorIconProps} ...props - Additional Phosphor icon props passed to the "as" icon.
 */
function Icon({ as: IconComponent, style, className: _className, size = 14, ...props }: IconProps) {
  const textStyle = React.useContext(TextStyleContext);

  const color = extractColor([styles.default, textStyle, style]);

  return <IconComponent color={color} size={size} {...props} />;
}

export { Icon };
export type { IconProps };
