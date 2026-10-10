import { useColorScheme } from "react-native";
import { createNanoIconSet } from "react-native-nano-icons";

import glyphMap from "../../../../assets/nanoicons/TroveCurrencies.glyphmap.json";
import { amountParts } from "../amount";
import { Text } from "../text";
import { colors, troveRawColors, type RawColorKey } from "../tokens";
import { entryTextStyle } from "./entry-text-style";
import type { EntrySize } from "./entry-amount-utils";

const CurrencyGlyphIcon = createNanoIconSet(glyphMap);

/** Plex Mono's cap height relative to its font size. */
const GLYPH_RATIO = 0.7;

interface EntryGlyphProps {
  currency: string;
  size: EntrySize;
  /** Nothing typed: the glyph fades with the digits. */
  faded: boolean;
}

/** Currency sign beside the typed amount, tinted entry.glyph (text.faded while empty). */
export function EntryGlyph({ currency, size, faded }: EntryGlyphProps) {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const { glyph, symbol } = amountParts(0, currency);
  if (glyph) {
    const key: RawColorKey = faded ? "textFaded" : "entryGlyph";
    return (
      <CurrencyGlyphIcon
        accessibilityElementsHidden
        accessible={false}
        color={troveRawColors[scheme][key]}
        importantForAccessibility="no"
        name={glyph}
        size={Math.round(GLYPH_RATIO * size)}
      />
    );
  }
  return (
    <Text
      accessibilityElementsHidden
      importantForAccessibility="no"
      maxFontSizeMultiplier={1}
      style={[entryTextStyle(size), { color: faded ? colors.text.faded : colors.entry.glyph }]}
      variant="amountHero"
    >
      {symbol}
    </Text>
  );
}
