import { StyleSheet, View } from "react-native";

import { space, Text } from "@/ui/trove";

import { GalleryGroup } from "./gallery-group";
import { TYPE_SAMPLES } from "./sample-data";

export function TypeSamples() {
  return (
    <GalleryGroup label="TYPE VARIANTS">
      <View style={styles.list}>
        {TYPE_SAMPLES.map(({ variant, sample }) => (
          <View key={variant} style={styles.item}>
            <Text tone="tertiary" variant="stamp">
              {variant}
            </Text>
            <Text variant={variant}>{sample}</Text>
          </View>
        ))}
      </View>
    </GalleryGroup>
  );
}

const styles = StyleSheet.create({
  list: { gap: space[3] },
  item: { gap: space[0.5] },
});
