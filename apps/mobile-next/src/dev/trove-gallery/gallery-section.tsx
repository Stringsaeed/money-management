import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { space, Text } from "@/ui/trove";

interface GallerySectionProps {
  title: string;
  /** Names the canvas board this section mirrors. */
  stamp: string;
  children: ReactNode;
}

export function GallerySection({ title, stamp, children }: GallerySectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" variant="titleMd">
          {title}
        </Text>
        <Text tone="tertiary" variant="stamp">
          {stamp}
        </Text>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space[4] },
  heading: { gap: space[1] },
  body: { gap: space[4] },
});
