import { useState } from "react";
import { StyleSheet, View } from "react-native";

import type { V2EnvelopeGroup } from "@trove/api/v2/contracts";

import { Button, Chip, space, Text, TextField } from "@/ui/trove";

import { GROUP_LABELS, GROUP_ORDER } from "./setup-types";

interface AddItemRowProps {
  readonly onAdd: (name: string, group: V2EnvelopeGroup) => void;
}

/** "Add your own": a name and the group it belongs to. */
export function AddItemRow({ onAdd }: AddItemRowProps) {
  const [name, setName] = useState("");
  const [group, setGroup] = useState<V2EnvelopeGroup>("everyday");
  const trimmed = name.trim();

  return (
    <View style={styles.group}>
      <Text variant="titleMd">Add your own</Text>
      <TextField
        label="Name"
        placeholder="Gym, pets, gifts"
        value={name}
        onChangeText={setName}
        maxLength={120}
      />
      <View style={styles.chips}>
        {GROUP_ORDER.map((option) => (
          <Chip
            key={option}
            label={GROUP_LABELS[option]}
            selected={group === option}
            onPress={() => setGroup(option)}
          />
        ))}
      </View>
      <Button
        fullWidth
        label="Add"
        variant="secondary"
        disabled={trimmed.length === 0}
        onPress={() => {
          onAdd(trimmed, group);
          setName("");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: space[3] },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
});
