import { StyleSheet, Text as RNText, type TextProps } from "react-native";

// ─── Manrope font-weight map ──────────────────────────────────────────────────
//
// Maps React Native fontWeight values to the correct Manrope font file name,
// so that custom font files are used instead of OS font synthesis.

const WEIGHT_TO_MANROPE: Record<string, string> = {
  "100": "Manrope_200ExtraLight",
  "200": "Manrope_200ExtraLight",
  "300": "Manrope_300Light",
  "400": "Manrope_400Regular",
  normal: "Manrope_400Regular",
  "500": "Manrope_500Medium",
  "600": "Manrope_600SemiBold",
  "700": "Manrope_700Bold",
  bold: "Manrope_700Bold",
  "800": "Manrope_800ExtraBold",
  "900": "Manrope_800ExtraBold",
};

// NativeWind / Tailwind font-weight class names → Manrope variant
const TAILWIND_WEIGHT_TO_MANROPE: Record<string, string> = {
  "font-thin": "Manrope_200ExtraLight",
  "font-extralight": "Manrope_200ExtraLight",
  "font-light": "Manrope_300Light",
  "font-normal": "Manrope_400Regular",
  "font-medium": "Manrope_500Medium",
  "font-semibold": "Manrope_600SemiBold",
  "font-bold": "Manrope_700Bold",
  "font-extrabold": "Manrope_800ExtraBold",
  "font-black": "Manrope_800ExtraBold",
};

function resolveManropeFont(fontWeight?: string | number, className?: string): string {
  // 1. Prefer className-based resolution (NativeWind / Tailwind)
  if (className) {
    const tokens = className.split(/\s+/);
    for (const token of tokens) {
      const font = TAILWIND_WEIGHT_TO_MANROPE[token];
      if (font) return font;
    }
  }
  // 2. Fall back to inline fontWeight
  if (fontWeight != null) {
    return WEIGHT_TO_MANROPE[String(fontWeight)] ?? "Manrope_400Regular";
  }
  return "Manrope_400Regular";
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
 * // Inline style
 * <Text style={{ fontSize: 16, fontWeight: "700" }}>Bold</Text>
 */
export function Text({ style, className, ...rest }: TextProps & { className?: string }) {
  const flat = StyleSheet.flatten(style);
  const fontFamily = resolveManropeFont(flat?.fontWeight as string | undefined, className);

  return (
    <RNText
      className={className}
      style={[{ fontFamily: "Manrope_400Regular" }, style, { fontFamily }]}
      {...rest}
    />
  );
}
