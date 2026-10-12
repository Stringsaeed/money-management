import { StyleSheet, View } from "react-native";

import type { V2EnvelopeGroup } from "@trove/api/v2/contracts";

import { SelectChip, space, Text } from "@/ui/trove";

import { GroupAddField } from "./group-add-field";
import { SectionStamp } from "./section-stamp";
import { GROUP_ADD_LABELS, GROUP_HINTS, GROUP_LABELS } from "./setup-types";

export interface ItemChip {
  readonly key: string;
  readonly name: string;
  readonly emoji: string;
  readonly ticked: boolean;
}

interface ItemGroupProps {
  readonly group: V2EnvelopeGroup;
  readonly chips: readonly ItemChip[];
  readonly onToggle: (key: string, ticked: boolean) => void;
  /** This group's add field is open. */
  readonly adding: boolean;
  readonly onAddOpen: () => void;
  readonly onAddClose: () => void;
  readonly onAdd: (name: string) => void;
}

/** One group of What it's for: stamp and hint, tick chips, and the dashed add chip. */
export function ItemGroup({
  group,
  chips,
  onToggle,
  adding,
  onAddOpen,
  onAddClose,
  onAdd,
}: ItemGroupProps) {
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <SectionStamp label={GROUP_LABELS[group].toUpperCase()} />
        <Text style={styles.hint} tone="secondary" variant="bodySm">
          {GROUP_HINTS[group]}
        </Text>
      </View>
      <View style={styles.chips}>
        {chips.map((chip) => (
          <SelectChip
            key={chip.key}
            variant="check"
            emoji={chip.emoji}
            label={chip.name}
            selected={chip.ticked}
            onPress={() => onToggle(chip.key, !chip.ticked)}
          />
        ))}
        <SelectChip
          variant="add"
          label={GROUP_ADD_LABELS[group]}
          selected={adding}
          onPress={adding ? onAddClose : onAddOpen}
        />
      </View>
      {adding ? <GroupAddField group={group} onAdd={onAdd} onClose={onAddClose} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  heading: { gap: 1 },
  hint: { lineHeight: 18 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
});
