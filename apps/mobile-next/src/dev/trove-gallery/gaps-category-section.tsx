import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { CategoryTile, space } from "@/ui/trove";
import {
  CategoryPreview,
  CurrencyBadge,
  EmojiGrid,
  SwatchPicker,
  type EmojiOption,
} from "@/ui/trove/category";

import { GalleryGroup } from "./gallery-group";
import { GalleryRow } from "./gallery-row";
import { GallerySection } from "./gallery-section";
import { GapsTileSample } from "./gaps-tile-sample";

const EMOJI_OPTIONS: readonly EmojiOption[] = [
  { glyph: "🍽️", name: "Dining" },
  { glyph: "☕", name: "Coffee" },
  { glyph: "🍔", name: "Fast food" },
  { glyph: "🛒", name: "Groceries" },
  { glyph: "🍕", name: "Pizza" },
  { glyph: "🥐", name: "Bakery" },
  { glyph: "🍣", name: "Sushi" },
  { glyph: "🧃", name: "Drinks" },
  { glyph: "🍦", name: "Treats" },
  { glyph: "🥗", name: "Salad" },
  { glyph: "🍜", name: "Noodles" },
  { glyph: "🧁", name: "Sweets" },
];

const PREVIEWS = [
  { emoji: "🛒", name: "Groceries", color: "#3E4CF0" },
  { emoji: "🍽️", name: "Dining", color: "#EB6834" },
  { emoji: "🎬", name: "Leisure", color: "#6E8B1E" },
] as const;

const BADGE_SIZES = [24, 36, 48] as const;

const CURRENCIES = ["AED", "SAR", "EUR", "GBP", "JPY", "USD"] as const;

export function GapsCategorySection() {
  const [color, setColor] = useState<string>("#EB6834");
  const [emoji, setEmoji] = useState<string>("🍽️");

  return (
    <GallerySection stamp="GAPS · CATEGORIES & ACCOUNTS" title="Categories, accounts & kind tiles">
      <GalleryGroup label="SWATCH PICKER · 9 COLOURS">
        <SwatchPicker onChange={setColor} value={color} />
      </GalleryGroup>
      <GalleryGroup label="EMOJI GRID · TINTED BY CHOSEN COLOUR">
        <EmojiGrid color={color} onChange={setEmoji} options={EMOJI_OPTIONS} value={emoji} />
      </GalleryGroup>
      <GalleryGroup label="EDITOR PREVIEW · USER'S COLOUR">
        <View style={styles.previews}>
          <CategoryPreview color={color} emoji={emoji} name="Your category" />
          {PREVIEWS.map((preview) => (
            <CategoryPreview key={preview.name} {...preview} />
          ))}
        </View>
      </GalleryGroup>
      <GalleryGroup label="CATEGORY TILE · EMOJI OR KIND ICON">
        <GalleryRow>
          <GapsTileSample label="Emoji + colour">
            <CategoryTile color="#3E4CF0" icon="🛒" />
          </GapsTileSample>
          <GapsTileSample label="Income">
            <CategoryTile kind="income" />
          </GapsTileSample>
          <GapsTileSample label="Expense">
            <CategoryTile kind="expense" />
          </GapsTileSample>
          <GapsTileSample label="Transfer">
            <CategoryTile kind="transfer" />
          </GapsTileSample>
          <GapsTileSample label="Small">
            <CategoryTile kind="income" size="sm" />
          </GapsTileSample>
        </GalleryRow>
      </GalleryGroup>
      <GalleryGroup label="CURRENCY BADGE · 24 / 36 / 48">
        {BADGE_SIZES.map((size) => (
          <GalleryRow key={size}>
            {CURRENCIES.map((code) => (
              <CurrencyBadge code={code} key={code} size={size} />
            ))}
          </GalleryRow>
        ))}
      </GalleryGroup>
    </GallerySection>
  );
}

const styles = StyleSheet.create({
  previews: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
});
