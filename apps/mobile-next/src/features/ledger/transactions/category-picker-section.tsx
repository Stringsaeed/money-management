import { StyleSheet, View } from "react-native";

import type { V2Category } from "@trove/api/v2/contracts";

import { OptionTile, OptionTileGrid, space, Text } from "@/ui/trove";

import { categoryEmoji } from "./transaction-display";

interface CategoryPickerSectionProps {
  readonly title: string;
  readonly categories: readonly V2Category[];
  readonly selectedId: string | null;
  readonly autoSelected: boolean;
  readonly onSelect: (category: V2Category) => void;
  /** Offered when AI can choose between this section's categories. */
  readonly onSelectAuto?: () => void;
}

/** One kind's categories as a tile grid, led by its "AI pick" tile when available. */
export function CategoryPickerSection({
  title,
  categories,
  selectedId,
  autoSelected,
  onSelect,
  onSelectAuto,
}: CategoryPickerSectionProps) {
  if (categories.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" tone="secondary" variant="labelMd">
        {title}
      </Text>
      <OptionTileGrid accessibilityLabel={title}>
        {onSelectAuto ? (
          <OptionTile
            emoji="✨"
            key="auto"
            layout="grid"
            name="AI pick"
            onPress={onSelectAuto}
            selected={autoSelected}
          />
        ) : null}
        {categories.map((category) => (
          <OptionTile
            emoji={categoryEmoji(category.icon)}
            key={category.id}
            layout="grid"
            name={category.name}
            onPress={() => onSelect(category)}
            selected={category.id === selectedId}
          />
        ))}
      </OptionTileGrid>
    </View>
  );
}

const styles = StyleSheet.create({ section: { gap: space[2] } });
