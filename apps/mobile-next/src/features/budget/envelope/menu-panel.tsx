import { router } from "expo-router";
import { Alert, StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { useLedgerMutations } from "@/data/ledger-queries";
import { Button } from "@/ui/button";
import { colors, radii, spacing } from "@/ui/design-tokens";
import { SelectRow } from "@/ui/select-row";
import { Switch } from "@/ui/switch";
import { Text } from "@/ui/text";
import { showToast } from "@/ui/toast";
import { formatMoneyMinor } from "@/utils/money";

import type { EnvelopeLine } from "../home/home-model";

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
  const { updateEnvelope } = useLedgerMutations();
  const write = useEnvelopeWrite();
  const { envelope, totals } = line;

  const setStartFresh = (startFresh: boolean) =>
    void write.run(() => updateEnvelope(envelope.id, { startFresh }, envelope.version));

  const archive = () =>
    Alert.alert(
      `Archive ${envelope.name}?`,
      `Its ${formatMoneyMinor(Math.max(totals.leftMinor, 0), BUDGET_CURRENCY)} left goes back to Not planned yet, and spending in its categories stops counting. You can't undo this.`,
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
      <Text variant="title" accessibilityRole="header">
        {envelope.name}
      </Text>
      <SelectRow
        label="Change plan"
        value={formatMoneyMinor(totals.plannedMinor, BUDGET_CURRENCY)}
        onPress={() => onOpen("plan")}
      />
      <SelectRow
        label="Change group"
        value={GROUP_LABEL[envelope.group]}
        onPress={() => onOpen("group")}
      />
      <SelectRow
        label="Categories"
        value={`${envelope.categoryIds.length} mapped`}
        onPress={() => onOpen("categories")}
      />
      <SelectRow label="History" onPress={() => onOpen("history")} />
      <View style={styles.toggle}>
        <View style={styles.toggleCopy}>
          <Text variant="body">Start fresh each month</Text>
          <Text variant="caption">{"Leftover money doesn't carry into the next month."}</Text>
        </View>
        <Switch
          accessibilityLabel="Start fresh each month"
          value={envelope.startFresh}
          disabled={write.busy}
          onValueChange={setStartFresh}
        />
      </View>
      <PanelError message={write.error} />
      <Button title="Archive envelope" variant="destructive" onPress={archive} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[3] },
  toggle: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderCurve: "continuous",
    borderRadius: radii.lg,
    flexDirection: "row",
    gap: spacing[3],
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  toggleCopy: { flex: 1, gap: spacing[1] },
});
