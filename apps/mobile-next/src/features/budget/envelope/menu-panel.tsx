import { router } from "expo-router";
import { Alert, StyleSheet, View } from "react-native";

import { useLedgerMutations } from "@/data/ledger-queries";
import { Amount, Button, ListGroup, ListRow, showToast, space, Switch, Text } from "@/ui/trove";

import { useBudgetCurrency, useBudgetMoney } from "../currency/use-budget-currency";
import type { EnvelopeLine } from "../home/home-model";
import { PLAN_ADMIN_ONLY } from "../role/budget-role";
import { useBudgetRole } from "../role/use-budget-role";

import { GROUP_LABEL } from "./group-panel";
import { PanelError } from "./panel-error";
import { useEnvelopeWrite } from "./use-envelope-write";

export type EnvelopePanel = "menu" | "plan" | "group" | "categories" | "history";

interface MenuPanelProps {
  readonly line: EnvelopeLine;
  readonly onOpen: (panel: EnvelopePanel) => void;
  readonly onClose: () => void;
}

/** The ••• menu: every advanced envelope action lives here and nowhere else. */
export function MenuPanel({ line, onOpen, onClose }: MenuPanelProps) {
  const money = useBudgetMoney();
  const currency = useBudgetCurrency();
  const { updateEnvelope } = useLedgerMutations();
  const write = useEnvelopeWrite();
  const { canEditPlan } = useBudgetRole();
  const { envelope, totals } = line;

  const setStartFresh = (startFresh: boolean) =>
    void write.run(() => updateEnvelope(envelope.id, { startFresh }, envelope.version));

  const archive = () =>
    Alert.alert(
      `Archive ${envelope.name}?`,
      `Its ${money(Math.max(totals.leftMinor, 0))} left goes back to Not planned yet, and spending in its categories stops counting. You can't undo this.`,
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: () => {
            void write
              .run(() => updateEnvelope(envelope.id, { lifecycle: "archived" }, envelope.version))
              .then((ok) => {
                if (!ok) return;
                onClose();
                showToast({ message: `${envelope.name} archived` });
                router.back();
              });
          },
        },
      ],
    );

  return (
    <View style={styles.container}>
      <Text variant="titleMd" accessibilityRole="header">
        {envelope.name}
      </Text>
      <ListGroup dividerInset={0}>
        {canEditPlan ? (
          <ListRow
            chevron
            title="Change plan"
            trailing={<Amount currency={currency} minor={totals.plannedMinor} tone="secondary" />}
            onPress={() => onOpen("plan")}
          />
        ) : null}
        {canEditPlan ? (
          <ListRow
            chevron
            title="Change group"
            value={GROUP_LABEL[envelope.group]}
            onPress={() => onOpen("group")}
          />
        ) : null}
        {canEditPlan ? (
          <ListRow
            chevron
            title="Categories"
            value={`${envelope.categoryIds.length} mapped`}
            onPress={() => onOpen("categories")}
          />
        ) : null}
        <ListRow chevron title="History" onPress={() => onOpen("history")} />
      </ListGroup>
      {canEditPlan ? (
        <>
          <ListGroup dividerInset={0}>
            <ListRow
              title="Start fresh each month"
              subtitle={"Leftover money doesn't carry into the next month."}
              trailing={
                <Switch
                  accessibilityLabel="Start fresh each month"
                  value={envelope.startFresh}
                  disabled={write.busy}
                  onValueChange={setStartFresh}
                />
              }
            />
          </ListGroup>
          <PanelError message={write.error} />
          <Button fullWidth label="Archive envelope" variant="delete" onPress={archive} />
        </>
      ) : (
        <Text tone="secondary" variant="bodySm">
          {PLAN_ADMIN_ONLY}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space[3] },
});
