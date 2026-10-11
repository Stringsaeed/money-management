import { StyleSheet, View } from "react-native";

import { Button } from "@/ui/button";
import { spacing } from "@/ui/design-tokens";
import { Surface } from "@/ui/surface";
import { Text } from "@/ui/text";

const STEPS = [
  { title: "Payday and money", detail: "When you get paid and what you have now." },
  { title: "What it is for", detail: "Bills, everyday spending, and things you save for." },
  { title: "Plan your month", detail: "Give every dirham a job." },
] as const;

interface BudgetIntroProps {
  readonly hasDraft: boolean;
  readonly onStart: () => void;
  readonly onNotNow: () => void;
}

/** S1: one pitch and one way in. A saved draft turns Start into Continue setup. */
export function BudgetIntro({ hasDraft, onStart, onNotNow }: BudgetIntroProps) {
  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text variant="headline">Know what is safe to spend</Text>
        <Text variant="body">
          Plan your month in about three minutes. No bank connection needed.
        </Text>
      </View>
      <Surface variant="recessed">
        {STEPS.map((step, index) => (
          <View key={step.title} style={styles.step}>
            <Text variant="label">{index + 1}</Text>
            <View style={styles.stepCopy}>
              <Text>{step.title}</Text>
              <Text variant="caption">{step.detail}</Text>
            </View>
          </View>
        ))}
      </Surface>
      <View style={styles.actions}>
        <Button title={hasDraft ? "Continue setup" : "Start"} onPress={onStart} />
        <Button title="Not now" variant="ghost" onPress={onNotNow} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[6] },
  heading: { gap: spacing[2] },
  step: { alignItems: "flex-start", flexDirection: "row", gap: spacing[3] },
  stepCopy: { flex: 1, gap: spacing[0.5] },
  actions: { gap: spacing[2] },
});
