import { StyleSheet, View } from "react-native";

import { Button, Card, space, Text } from "@/ui/trove";

import { PLAN_ADMIN_ONLY } from "./role/budget-role";

const STEPS = [
  { title: "Payday and money", detail: "When you get paid and what you have now." },
  { title: "What it is for", detail: "Bills, everyday spending, and things you save for." },
  { title: "Plan your month", detail: "Give every dirham a job." },
] as const;

interface BudgetIntroProps {
  readonly hasDraft: boolean;
  /** False for a household member who is not the admin: only the admin starts the budget. */
  readonly canStart: boolean;
  readonly onStart: () => void;
  readonly onNotNow: () => void;
}

/** S1: one pitch and one way in. A saved draft turns Start into Continue setup. */
export function BudgetIntro({ hasDraft, canStart, onStart, onNotNow }: BudgetIntroProps) {
  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text variant="titleLg">Know what is safe to spend</Text>
        <Text>Plan your month in about three minutes. No bank connection needed.</Text>
      </View>
      <Card style={styles.steps}>
        {STEPS.map((step, index) => (
          <View key={step.title} style={styles.step}>
            <Text tone="secondary" variant="labelSm">
              {index + 1}
            </Text>
            <View style={styles.stepCopy}>
              <Text>{step.title}</Text>
              <Text tone="secondary" variant="bodySm">
                {step.detail}
              </Text>
            </View>
          </View>
        ))}
      </Card>
      <View style={styles.actions}>
        {canStart ? (
          <Button fullWidth label={hasDraft ? "Continue setup" : "Start"} onPress={onStart} />
        ) : (
          <Text accessibilityRole="alert" tone="secondary" variant="bodySm">
            {PLAN_ADMIN_ONLY}
          </Text>
        )}
        <Button fullWidth label="Not now" variant="tertiary" onPress={onNotNow} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space[6] },
  heading: { gap: space[2] },
  steps: { gap: space[3] },
  step: { alignItems: "flex-start", flexDirection: "row", gap: space[3] },
  stepCopy: { flex: 1, gap: space[0.5] },
  actions: { gap: space[2] },
});
