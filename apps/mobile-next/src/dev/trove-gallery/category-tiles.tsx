import { StyleSheet, View } from "react-native";

import { CategoryTile, space, Text } from "@/ui/trove";

import { GalleryGroup } from "./gallery-group";
import { CATEGORY_TILES } from "./sample-data";

export function CategoryTiles() {
  return (
    <GalleryGroup label="CATEGORY COLORS · TINTED TILES">
      <View style={styles.grid}>
        {CATEGORY_TILES.map(({ key, label }) => (
          <View key={key} style={styles.item}>
            <CategoryTile icon={key} tint={key} />
            <Text variant="labelSm">{label}</Text>
          </View>
        ))}
        <View style={styles.item}>
          <CategoryTile icon="groceries" size="sm" tint="groceries" />
          <Text variant="labelSm">Small</Text>
        </View>
      </View>
    </GalleryGroup>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space[4] },
  item: { alignItems: "center", gap: space[1] },
});
