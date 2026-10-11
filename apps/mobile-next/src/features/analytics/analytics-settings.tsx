import { StyleSheet, View } from "react-native";

import { Surface, Switch, Text } from "@/ui";
import { spacing } from "@/ui/design-tokens";

import { setAnalyticsSharing } from "./analytics-store";
import { useAnalyticsSharing } from "./use-analytics-sharing";

export function AnalyticsSettings() {
  const sharing = useAnalyticsSharing();

  return (
    <Surface variant="raised" style={styles.card}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text variant="title">Share anonymous usage</Text>
          <Text variant="caption">
            Helps us improve budgeting. Never includes amounts, payees, notes, or account names.
          </Text>
        </View>
        <Switch
          accessibilityLabel="Share anonymous usage"
          value={sharing}
          onValueChange={setAnalyticsSharing}
        />
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing[4] },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3],
    justifyContent: "space-between",
  },
  copy: { flex: 1, gap: spacing[1] },
});
