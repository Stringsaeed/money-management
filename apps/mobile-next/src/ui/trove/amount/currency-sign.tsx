import { createNanoIconSet } from "react-native-nano-icons";
import { useColorScheme } from "react-native";

import glyphMap from "../../../../assets/nanoicons/TroveCurrencies.glyphmap.json";
import { Text, type TextTone } from "../text";
import { troveRawColors, type RawColorKey, type TypeVariant } from "../tokens";
import { amountParts } from "./amount-parts";

const CurrencyGlyphIcon = createNanoIconSet(glyphMap);

/** Glyph colors bridge the raw palette: the nano icon's native `color` prop rejects dynamic colors. */
const GLYPH_COLOR = {
  primary: "textPrimary",
  secondary: "textSecondary",
  onPaper: "textOnPaper",
  accent: "accentFill",
  positive: "positiveText",
  negative: "negativeText",
} as const satisfies Record<GlyphTone, RawColorKey>;

export type GlyphTone =
  | Extract<TextTone, "primary" | "secondary" | "onPaper" | "positive" | "negative">
  | "accent";

export interface CurrencySignProps {
  /** ISO 4217 code. AED and SAR draw SVG glyphs; € £ ¥ come from Plex Mono. */
  code: string;
  /** Text style the sign sits beside; the glyph is sized to its cap height. */
  variant?: TypeVariant;
  /** `accent` is the hero treatment: lime on dark, ink on paper. */
  tone?: GlyphTone;
}

export function CurrencySign({ code, variant = "amountMd", tone = "primary" }: CurrencySignProps) {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const { glyph, symbol } = amountParts(0, code);
  if (glyph) {
    return (
      <CurrencyGlyphIcon
        accessibilityElementsHidden
        accessible={false}
        color={troveRawColors[scheme][GLYPH_COLOR[tone]]}
        importantForAccessibility="no"
        name={glyph}
        size={Math.round(CAP_HEIGHT_RATIO * FONT_SIZE[variant])}
      />
    );
  }
  return (
    <Text
      accessibilityElementsHidden
      importantForAccessibility="no"
      tone={tone === "accent" ? "secondary" : tone}
      variant={variant}
    >
      {symbol}
    </Text>
  );
}

/** Plex Mono's cap height relative to its font size (30pt glyph beside 44pt digits). */
const CAP_HEIGHT_RATIO = 0.7;

const FONT_SIZE = {
  display: 34,
  titleLg: 28,
  titleMd: 20,
  titleSm: 17,
  bodyLg: 17,
  bodyMd: 15,
  bodySm: 13,
  labelLg: 17,
  labelMd: 15,
  labelSm: 13,
  amountHero: 44,
  amountLg: 24,
  amountMd: 15,
  amountSm: 13,
  stamp: 11,
  receipt: 13,
} as const satisfies Record<TypeVariant, number>;
