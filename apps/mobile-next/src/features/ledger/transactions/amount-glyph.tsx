import { StyleSheet, View } from "react-native";

import { CurrencyGlyph } from "@/ui/currency-glyph";
import { spacing } from "@/ui/design-tokens";

import type { AmountSymbol } from "./amount-entry";

interface AmountGlyphProps {
  readonly symbol: AmountSymbol;
  /** Font size of the amount's whole digits. */
  readonly fontSize: number;
  readonly active: boolean;
}

/** Nunito's descender is ~0.353em; lifting by it puts the glyph on the digits' baseline. */
const DESCENDER = 0.353;
const GLYPH_SCALE = 0.44;

/**
 * SVG currency glyphs (riyal, dirham) sit beside the amount text rather than inside it:
 * inline views drop to the line's descent instead of its baseline.
 */
export function AmountGlyph({ symbol, fontSize, active }: AmountGlyphProps) {
  if (symbol.kind !== "glyph") return null;
  return (
    <View style={[styles.glyph, { marginBottom: Math.round(fontSize * DESCENDER) }]}>
      <CurrencyGlyph active={active} name={symbol.name} size={Math.round(fontSize * GLYPH_SCALE)} />
    </View>
  );
}

const styles = StyleSheet.create({
  glyph: { marginRight: spacing[1] },
});
