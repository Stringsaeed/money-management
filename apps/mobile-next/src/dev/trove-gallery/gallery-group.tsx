import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { space, Text } from "@/ui/trove";

interface GalleryGroupProps {
  label: string;
  children: ReactNode;
}

/** A small captioned block inside a section. */
export function GalleryGroup({ label, children }: GalleryGroupProps) {
  return (
    <View style={styles.group}>
      <Text tone="secondary" variant="stamp">
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: space[2] },
});
