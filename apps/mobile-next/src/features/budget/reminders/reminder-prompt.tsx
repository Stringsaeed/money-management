import { StyleSheet, View } from "react-native";

import { Button, Card, space, Text } from "@/ui/trove";

interface ReminderPromptProps {
  readonly onEnable: () => void;
  readonly onNotNow: () => void;
}

/** Explains reminders before the system permission dialog, which only appears after "Turn on". */
export function ReminderPrompt({ onEnable, onNotNow }: ReminderPromptProps) {
  return (
    <Card style={styles.card}>
      <Text variant="titleMd">Get a nudge when a bill is due</Text>
      <Text tone="secondary" variant="bodySm">
        Trove can remind you on this phone: at most one reminder a day, plus one on payday. Nothing
        is paid or recorded until you tap Mark paid.
      </Text>
      <View style={styles.actions}>
        <Button fullWidth label="Turn on reminders" onPress={onEnable} />
        <Button fullWidth label="Not now" variant="tertiary" onPress={onNotNow} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space[2] },
  actions: { gap: space[2], paddingTop: space[1] },
});
