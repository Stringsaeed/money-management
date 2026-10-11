import { StyleSheet, View } from "react-native";

import type { V2EnvelopeGroup } from "@trove/api/v2/contracts";

import { useLedgerMutations } from "@/data/ledger-queries";
import { Chip } from "@/ui/chip";
import { spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";

import type { EnvelopeLine } from "../home/home-model";

import { PanelError } from "./panel-error";
import { PanelHeader } from "./panel-header";
import { useEnvelopeWrite } from "./use-envelope-write";

export const GROUP_LABEL = {
  bills: "Bills",
  everyday: "Everyday",
  saving: "Saving for",
} as const satisfies Record<V2EnvelopeGroup, string>;

const GROUPS: readonly V2EnvelopeGroup[] = ["everyday", "bills", "saving"];

interface GroupPanelProps {
  readonly line: EnvelopeLine;
  readonly onBack: () => void;
  readonly onDone: () => void;
}

/** Change group. History stays as it was; only Safe to spend recalculates. */
export function GroupPanel({ line, onBack, onDone }: GroupPanelProps) {
  const { updateEnvelope } = useLedgerMutations();
  const write = useEnvelopeWrite();
  const { envelope } = line;

  const choose = async (group: V2EnvelopeGroup) => {
    if (group === envelope.group) return;
    const ok = await write.run(() => updateEnvelope(envelope.id, { group }, envelope.version));
    if (ok) onDone();
  };

  return (
    <View style={styles.container}>
      <PanelHeader title="Change group" onBack={onBack} />
      <View style={styles.chips}>
        {GROUPS.map((group) => (
          <Chip
            key={group}
            label={GROUP_LABEL[group]}
            selected={group === envelope.group}
            onPress={() => void choose(group)}
          />
        ))}
      </View>
      <Text variant="caption">
        Only Everyday envelopes count toward Safe to spend. Past months stay as they were.
      </Text>
      <PanelError message={write.error} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[3] },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
});
