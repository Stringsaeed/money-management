import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { track } from "@/features/analytics";
import { Button, ListGroup, space, Text } from "@/ui/trove";
import { formatMoneyMinor } from "@/utils/money";

import { AddItemRow } from "./add-item-row";
import { ChoiceRow } from "./choice-row";
import { isItemTicked, resolveItemKey, type SetupItem } from "./setup-items";
import { SetupFrame } from "./setup-frame";
import { SetupRestart } from "./setup-restart";
import { SetupStatus } from "./setup-status";
import { GROUP_LABELS, GROUP_ORDER } from "./setup-types";
import { useSetupModel } from "./use-setup-model";

const itemDetail = (item: SetupItem): string | undefined => {
  if (item.recurringMinor) return `${formatMoneyMinor(item.recurringMinor, "AED")} a month`;
  if (item.lastPeriodMinor) return `${formatMoneyMinor(item.lastPeriodMinor, "AED")} last period`;
  return undefined;
};

/** S3: what the money is for, as a checklist of envelopes in three groups. */
export function ItemsScreen() {
  const { needsPayday, draft, setup, facts, categories, items, ticked } = useSetupModel();

  if (needsPayday) return <SetupRestart />;
  if (facts.isError && !facts.data) {
    return (
      <SetupStatus
        error={{ title: "Couldn't load your suggestions", onRetry: () => void facts.retry() }}
      />
    );
  }
  if (!facts.data) return <SetupStatus loading="Finding what you spend on…" />;

  const add = (name: string, group: SetupItem["group"]) => {
    const { key } = resolveItemKey(name, categories.data);
    const exists = items.some((item) => item.key === key);
    setup.update({
      selection: { ...draft.selection, [key]: true },
      ...(!exists && { custom: [...draft.custom, { name, group }] }),
    });
  };

  return (
    <SetupFrame
      step="Step 2 of 3"
      title="What is it for?"
      intro="Tick what you want to set money aside for. Each one gets its own envelope."
      footer={
        <>
          {ticked.length === 0 ? (
            <Text tone="secondary" variant="bodySm">
              Tick at least one to continue.
            </Text>
          ) : null}
          <Button
            fullWidth
            label="Next"
            disabled={ticked.length === 0}
            onPress={() => {
              setup.update({ step: "amounts" });
              track("budget_setup_step_completed", { step: "items" });
              router.push("/budget/setup/amounts");
            }}
          />
        </>
      }
    >
      {GROUP_ORDER.map((group) => (
        <View key={group} style={styles.group}>
          <Text variant="titleMd">{GROUP_LABELS[group]}</Text>
          <ListGroup dividerInset={0}>
            {items
              .filter((item) => item.group === group)
              .map((item) => {
                const isTicked = isItemTicked(item, draft.selection);
                return (
                  <ChoiceRow
                    key={item.key}
                    label={item.name}
                    detail={itemDetail(item)}
                    ticked={isTicked}
                    onPress={() =>
                      setup.update({ selection: { ...draft.selection, [item.key]: !isTicked } })
                    }
                  />
                );
              })}
          </ListGroup>
        </View>
      ))}
      <AddItemRow onAdd={add} />
    </SetupFrame>
  );
}

const styles = StyleSheet.create({
  group: { gap: space[2] },
});
