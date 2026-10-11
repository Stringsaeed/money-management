import { StyleSheet, View } from "react-native";

import { Button } from "@/ui/button";
import { colors, radii, spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";

interface ReminderPromptProps {
  readonly onEnable: () => void;
  readonly onNotNow: () => void;
}

/** Explains reminders before the system permission dialog, which only appears after "Turn on". */
export function ReminderPrompt({ onEnable, onNotNow }: ReminderPromptProps) {
  return (
    <View style={styles.card}>
      <Text variant="title">Get a nudge when a bill is due</Text>
      <Text variant="caption">
        Trove can remind you on this phone: at most one reminder a day, plus one on payday. Nothing
        is paid or recorded until you tap Mark paid.
      </Text>
      <View style={styles.actions}>
        <Button title="Turn on reminders" onPress={onEnable} />
        <Button title="Not now" variant="ghost" onPress={onNotNow} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderCurve: "continuous",
    borderRadius: radii.lg,
    gap: spacing[2],
    padding: spacing[4],
  },
  actions: { gap: spacing[2], paddingTop: spacing[1] },
});
