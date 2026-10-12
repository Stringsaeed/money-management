import { StyleSheet, View } from "react-native";

import type { V2Category } from "@trove/api/v2/contracts";

import { SelectChip, space } from "@/ui/trove";

import { categoryEmoji } from "./envelope-emoji";

interface CategoryChipsProps {
  readonly categories: readonly V2Category[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
}

/** The envelope's Categories, for an envelope that maps to several. */
export function CategoryChips({ categories, selectedId, onSelect }: CategoryChipsProps) {
  return (
    <View accessibilityLabel="Category" accessibilityRole="radiogroup" style={styles.wrap}>
      {categories.map((category) => (
        <SelectChip
          emoji={categoryEmoji(category)}
          key={category.id}
          label={category.name}
          onPress={() => onSelect(category.id)}
          selected={category.id === selectedId}
          size="md"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
});
