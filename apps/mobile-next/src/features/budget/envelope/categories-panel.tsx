import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { useCategoriesQuery, useLedgerMutations } from "@/data/ledger-queries";
import { Button, Chip, space, Text } from "@/ui/trove";

import type { ActiveBudgetView, EnvelopeLine } from "../home/home-model";

import { categoryChoices } from "./envelope-model";
import { PanelError } from "./panel-error";
import { PanelHeader } from "./panel-header";
import { useEnvelopeWrite } from "./use-envelope-write";

interface CategoriesPanelProps {
  readonly view: ActiveBudgetView;
  readonly line: EnvelopeLine;
  readonly onBack: () => void;
  readonly onDone: () => void;
}

/** Categories this envelope counts spending from: its own, plus any no other envelope uses. */
export function CategoriesPanel({ view, line, onBack, onDone }: CategoriesPanelProps) {
  const { updateEnvelope } = useLedgerMutations();
  const categories = useCategoriesQuery();
  const write = useEnvelopeWrite();
  const { envelope } = line;
  const choices = categoryChoices(view, categories.data, envelope.id);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set(envelope.categoryIds));

  const toggle = (id: string) => {
    write.clearError();
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  };
  const unchanged =
    selected.size === envelope.categoryIds.length &&
    envelope.categoryIds.every((id) => selected.has(id));

  const save = async () => {
    const ok = await write.run(() =>
      updateEnvelope(envelope.id, { categoryIds: [...selected] }, envelope.version),
    );
    if (ok) onDone();
  };

  return (
    <View style={styles.container}>
      <PanelHeader title="Categories" onBack={onBack} />
      <Text variant="bodySm" tone="secondary">
        Spending in these categories comes out of {envelope.name}. A category can belong to one
        envelope.
      </Text>
      <View style={styles.chips}>
        {choices.map(({ category }) => (
          <Chip
            key={category.id}
            label={category.name}
            selected={selected.has(category.id)}
            onPress={() => toggle(category.id)}
          />
        ))}
      </View>
      {selected.size === 0 ? (
        <Text variant="bodySm" tone="secondary">
          Pick at least one category.
        </Text>
      ) : null}
      <PanelError message={write.error} />
      <Button
        fullWidth
        label="Save"
        loading={write.busy}
        disabled={selected.size === 0 || unchanged}
        onPress={() => void save()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space[3] },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
});
