import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { track } from "@/features/analytics";
import { Button, space, Text } from "@/ui/trove";

import { AmountRow } from "./amount-row";
import { LeftToPlanBar } from "./left-to-plan-bar";
import { suggestedMinor } from "./setup-items";
import { SetupFrame } from "./setup-frame";
import { SetupRestart } from "./setup-restart";
import { SetupStatus } from "./setup-status";
import { parseAmountText } from "./setup-plan";
import { GROUP_LABELS, GROUP_ORDER } from "./setup-types";
import { useSetupModel } from "./use-setup-model";
import { decimalFromMinor } from "@/utils/money";

/** S4: a monthly amount per envelope, with Left to plan updating on every keystroke. */
export function AmountsScreen() {
  const { needsPayday, draft, setup, facts, ticked, preview, invalidAmounts } = useSetupModel();

  if (needsPayday) return <SetupRestart />;
  if (facts.isError && !facts.data) {
    return (
      <SetupStatus error={{ title: "Couldn't calculate", onRetry: () => void facts.retry() }} />
    );
  }
  if (!facts.data) return <SetupStatus loading="Working out what you have…" />;

  const left = preview?.leftToPlanMinor ?? null;
  const setAmount = (key: string, text: string) =>
    setup.update({ amounts: { ...draft.amounts, [key]: text } });
  const useSuggestions = () =>
    setup.update({
      amounts: {
        ...draft.amounts,
        ...Object.fromEntries(
          ticked.flatMap((item) => {
            const suggestion = suggestedMinor(item);
            return suggestion === null ? [] : [[item.key, decimalFromMinor(suggestion, "AED")]];
          }),
        ),
      },
    });

  return (
    <SetupFrame
      step="Step 3 of 3"
      title="Plan your month"
      intro="Give each envelope a monthly amount. Leave it empty for 0."
      pinned={<LeftToPlanBar leftMinor={left} />}
      footer={
        <Button
          fullWidth
          label="Next"
          disabled={left === null || left < 0 || invalidAmounts}
          onPress={() => {
            setup.update({ step: "review" });
            track("budget_setup_step_completed", { step: "amounts" });
            router.push("/budget/setup/review");
          }}
        />
      }
    >
      <View style={styles.actions}>
        <Button label="Use suggestions" variant="secondary" onPress={useSuggestions} />
        <Button
          label="Clear all"
          variant="tertiary"
          onPress={() => setup.update({ amounts: {} })}
        />
      </View>
      {GROUP_ORDER.map((group) => {
        const rows = ticked.filter((item) => item.group === group);
        return rows.length === 0 ? null : (
          <View key={group} style={styles.group}>
            <Text variant="titleMd">{GROUP_LABELS[group]}</Text>
            {rows.map((item) => (
              <AmountRow
                key={item.key}
                item={item}
                value={draft.amounts[item.key] ?? ""}
                invalid={parseAmountText(draft.amounts[item.key] ?? "") === null}
                onChange={(text) => setAmount(item.key, text)}
              />
            ))}
          </View>
        );
      })}
    </SetupFrame>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", gap: space[2] },
  group: { gap: space[4] },
});
