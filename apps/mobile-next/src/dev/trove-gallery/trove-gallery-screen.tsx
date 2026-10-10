import { ScrollView, StyleSheet, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, layout, space, Text, ToastHost } from "@/ui/trove";

import { visibleSections } from "./gallery-sections";

export interface TroveGalleryScreenProps {
  /** Render one section only (`trove-next://dev/trove?section=controls`). */
  section?: string;
}

export function TroveGalleryScreen({ section }: TroveGalleryScreenProps) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? "light";

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + space[16],
            paddingLeft: insets.left + layout.screenGutter,
            paddingRight: insets.right + layout.screenGutter,
            paddingTop: insets.top + space[4],
          },
        ]}
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
      >
        <View style={styles.header}>
          <Text accessibilityRole="header" variant="display">
            Trove gallery
          </Text>
          <Text tone="secondary" variant="stamp">
            {`COLOR SCHEME · ${scheme.toUpperCase()}`}
          </Text>
        </View>
        {visibleSections(section).map(({ key, Section }) => (
          <Section key={key} />
        ))}
      </ScrollView>
      <ToastHost />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.bg.canvas, flex: 1 },
  scroll: { flex: 1 },
  content: {
    gap: layout.sectionGap,
  },
  header: { gap: space[1] },
});
