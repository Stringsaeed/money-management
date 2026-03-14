import { StyleSheet, Text as RNText, type TextProps } from "react-native";
import { twMerge } from "tailwind-merge";

// ─── Manrope font-weight map ──────────────────────────────────────────────────
//
// Maps React Native fontWeight values to the correct Manrope font file name,
// so that custom font files are used instead of OS font synthesis.

const WEIGHT_TO_MANROPE = {
  "100": "font-thin",
  "200": "font-extralight",
  "300": "font-light",
  "400": "font-normal",
  normal: "font-normal",
  "500": "font-medium",
  "600": "font-semibold",
  "700": "font-bold",
  bold: "font-bold",
  "800": "font-extrabold",
  "900": "font-extrabold",
} as const;

function resolveManropeFont(fontWeight?: string | number) {
  if (fontWeight) {
    return (
      WEIGHT_TO_MANROPE[fontWeight as keyof typeof WEIGHT_TO_MANROPE] ?? ("font-normal" as const)
    );
  }
  return "font-normal" as const;
}

// ─── Component ────────────────────────────────────────────────────────────────

export type { TextProps };

/**
 * Shared Text component that always renders with the Manrope typeface.
 *
 * Drop-in replacement for React Native's <Text />.
 * Supports both inline `style` fontWeight and NativeWind `className` font
 * utilities (e.g. `font-semibold`, `font-bold`) for correct font-file
 * selection — preventing OS font synthesis in favour of the real Manrope
 * weight variants.
 *
 * @example
 * // Basic
 * <Text>Hello world</Text>
 *
 * // NativeWind
 * <Text className="text-lg font-semibold text-gray-900">Title</Text>
 *
 */
export function Text({ style, className, ...rest }: TextProps & { className?: string }) {
  const flat = StyleSheet.flatten(style);
  const fontFamily = resolveManropeFont(flat?.fontWeight as string | undefined);

  return <RNText className={twMerge(className, fontFamily)} style={style} {...rest} />;
}
