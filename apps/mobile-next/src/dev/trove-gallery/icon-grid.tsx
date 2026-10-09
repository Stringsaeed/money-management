import { StyleSheet, View } from "react-native";

import { GalleryGroup } from "./gallery-group";
import { IconCell } from "./icon-cell";
import { CATEGORY_ICON_NAMES, NAV_ICON_NAMES, UI_ICON_NAMES } from "./sample-data";

export function IconGrid() {
  return (
    <>
      <GalleryGroup label="NAV ICONS · OUTLINE, THEN FILLED (*)">
        <View style={styles.grid}>
          {NAV_ICON_NAMES.map((name) => (
            <IconCell key={name} name={name} />
          ))}
          {NAV_ICON_NAMES.map((name) => (
            <IconCell filled key={`${name}-filled`} name={name} />
          ))}
        </View>
      </GalleryGroup>
      <GalleryGroup label="UI ICONS">
        <View style={styles.grid}>
          {UI_ICON_NAMES.map((name) => (
            <IconCell key={name} name={name} />
          ))}
        </View>
      </GalleryGroup>
      <GalleryGroup label="CATEGORY ICONS">
        <View style={styles.grid}>
          {CATEGORY_ICON_NAMES.map((name) => (
            <IconCell key={name} name={name} />
          ))}
        </View>
      </GalleryGroup>
    </>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap" },
});
