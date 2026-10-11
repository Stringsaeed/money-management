import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { track } from "@/features/analytics";
import { useLedgerMutations } from "@/data/ledger-queries";
import { AmountInput, Button, showToast, space, Text } from "@/ui/trove";
import { formatMoneyMinor, parseMoneyMinor } from "@/utils/money";

import { PanelError } from "../envelope/panel-error";
import { useEnvelopeWrite } from "../envelope/use-envelope-write";
import { envelopeLines, type ActiveBudgetView } from "../home/home-model";

import { UNPLANNED_KEY, moveHint, movePreview, moveInput, placesFrom } from "./cover-move-model";
import { PlaceChips } from "./place-chips";

interface MoveFormProps {
  readonly view: ActiveBudgetView;
  /** Envelope to take from; `null` starts at Not planned yet. */
  readonly fromId: string | null;
  readonly onDone: () => void;
}

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

/** O3: move money between two places. The amount can't pass what the source has left. */
export function MoveForm({ view, fromId, onDone }: MoveFormProps) {
  const { createAssignments } = useLedgerMutations();
  const write = useEnvelopeWrite();
  const places = placesFrom(envelopeLines(view), view.current.unassignedMinor);
  const [fromKey, setFromKey] = useState(fromId ?? UNPLANNED_KEY);
  const [toKey, setToKey] = useState<string | null>(null);
  const [text, setText] = useState("");

  const from = places.find((place) => place.key === fromKey) ?? places[0];
  const to = places.find((place) => place.key === toKey);
  const amountMinor = parseMoneyMinor(text.trim(), BUDGET_CURRENCY);
  const preview = from && to && amountMinor !== null ? movePreview(from, to, amountMinor) : null;

  const change = () => write.clearError();
  const move = async () => {
    if (!from || !to || preview?.status !== "ok" || amountMinor === null) return;
    const ok = await write.run(() => createAssignments(moveInput(from, to, amountMinor)));
    if (!ok) return;
    track("money_moved", {});
    showToast({ message: `Moved ${money(amountMinor)} to ${to.name}` });
    onDone();
  };

  return (
    <View style={styles.container}>
      <Text variant="titleMd" accessibilityRole="header">
        Move money
      </Text>
      <PlaceChips
        label="From"
        places={places.filter((place) => place.key !== toKey)}
        selectedKey={fromKey}
        onSelect={(key) => {
          change();
          setFromKey(key);
        }}
      />
      <PlaceChips
        label="To"
        places={places.filter((place) => place.key !== fromKey)}
        selectedKey={toKey}
        onSelect={(key) => {
          change();
          setToKey(key);
        }}
      />
      <AmountInput
        currency={BUDGET_CURRENCY}
        label="Amount"
        value={text}
        onChangeText={(value) => {
          change();
          setText(value);
        }}
      />
      <Text variant="bodySm" tone="secondary" accessibilityLiveRegion="polite">
        {moveHint({ from, to, text, amountMinor, money })}
      </Text>
      <PanelError message={write.error} />
      <Button
        fullWidth
        label="Move"
        loading={write.busy}
        disabled={preview?.status !== "ok"}
        onPress={() => void move()}
      />
    </View>
  );
}

const styles = StyleSheet.create({ container: { gap: space[3] } });
