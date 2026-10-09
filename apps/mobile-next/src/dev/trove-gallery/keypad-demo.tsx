import { useState } from "react";
import { StyleSheet } from "react-native";

import {
  Amount,
  Card,
  formatKeypadValue,
  Keypad,
  keypadValueToMinor,
  localeDecimalSeparator,
  space,
  Text,
} from "@/ui/trove";

import { GalleryGroup } from "./gallery-group";
import { GALLERY_CURRENCY } from "./sample-data";

export function KeypadDemo() {
  const [value, setValue] = useState("");

  return (
    <GalleryGroup label="KEYPAD · CONTROLLED">
      <Card style={styles.entry}>
        <Text tone="secondary" variant="stamp">
          {`ENTERED · ${formatKeypadValue(value, localeDecimalSeparator())}`}
        </Text>
        <Amount currency={GALLERY_CURRENCY} minor={keypadValueToMinor(value, 2)} size="hero" />
      </Card>
      <Keypad onChange={setValue} value={value} />
    </GalleryGroup>
  );
}

const styles = StyleSheet.create({
  entry: { gap: space[2] },
});
