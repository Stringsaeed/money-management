import { StyleSheet, View } from "react-native";

import { Button } from "@/ui/button";
import { Text } from "@/ui/text";

interface PanelHeaderProps {
  readonly title: string;
  readonly onBack: () => void;
}

/** Title of one ••• panel with a way back to the menu. */
export function PanelHeader({ title, onBack }: PanelHeaderProps) {
  return (
    <View style={styles.header}>
      <Text variant="title" accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Button title="Back" variant="ghost" onPress={onBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  title: { flex: 1 },
});
