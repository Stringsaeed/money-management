import { StyleSheet, View } from "react-native";

import { Surface, Switch, Text } from "@/ui";
import { colors, spacing } from "@/ui/design-tokens";

import { updateAiPreferences } from "./ai-store";
import { useAiPreferences } from "./use-ai-preferences";

export function AiSettings() {
  const { autoCategorize } = useAiPreferences();

  return (
    <Surface variant="raised" style={styles.card}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text variant="title">✨ Smart categories</Text>
          <Text variant="caption">
            AI picks a category from a new transaction&apos;s note, like Breadfast → Groceries.
          </Text>
        </View>
        <Switch
          accessibilityLabel="Smart categories"
          value={autoCategorize}
          onValueChange={(next) => updateAiPreferences({ autoCategorize: next })}
        />
      </View>
      <Text variant="caption" style={styles.privacy}>
        🔒 Only the note, its currency, and your category names are sent. Never amounts, balances,
        accounts, or who you are. An unfamiliar name may be looked up on the web. AI runs in an
        isolated request on our server, can&apos;t see the rest of your ledger, and your data is
        never used to train AI.
      </Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing[3] },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3],
    justifyContent: "space-between",
  },
  copy: { flex: 1, gap: spacing[1] },
  privacy: { color: colors.mutedForeground },
});
