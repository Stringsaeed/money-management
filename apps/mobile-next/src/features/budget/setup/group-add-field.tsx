import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { EaseView } from "react-native-ease";

import type { V2EnvelopeGroup } from "@trove/api/v2/contracts";

import { useReducedMotion } from "@/ui/motion";
import { FlowButton, motion, space, TextField, troveTransition } from "@/ui/trove";

import { GROUP_ADD_LABELS, GROUP_ADD_PLACEHOLDERS } from "./setup-types";

interface GroupAddFieldProps {
  readonly group: V2EnvelopeGroup;
  readonly onAdd: (name: string) => void;
  readonly onClose: () => void;
}

/** The name field an add chip opens: Add ticks the new row in this group, Cancel closes it. */
export function GroupAddField({ group, onAdd, onClose }: GroupAddFieldProps) {
  const reducedMotion = useReducedMotion();
  const [name, setName] = useState("");
  const trimmed = name.trim();
  const submit = () => {
    if (!trimmed) return;
    onAdd(trimmed);
    setName("");
  };

  return (
    <EaseView
      animate={{ opacity: 1 }}
      initialAnimate={{ opacity: 0 }}
      style={styles.field}
      transition={troveTransition(reducedMotion, motion.base)}
    >
      <TextField
        autoFocus
        label={GROUP_ADD_LABELS[group]}
        maxLength={120}
        onChangeText={setName}
        onSubmitEditing={submit}
        placeholder={GROUP_ADD_PLACEHOLDERS[group]}
        returnKeyType="done"
        submitBehavior="submit"
        value={name}
      />
      <View style={styles.actions}>
        <FlowButton label="Cancel" onPress={onClose} size="pair" style={styles.flex} tone="text" />
        <FlowButton
          disabled={!trimmed}
          label="Add"
          onPress={submit}
          size="pair"
          style={styles.flex}
        />
      </View>
    </EaseView>
  );
}

const styles = StyleSheet.create({
  field: { gap: space[2] },
  actions: { flexDirection: "row", gap: space[2] },
  flex: { flex: 1 },
});
