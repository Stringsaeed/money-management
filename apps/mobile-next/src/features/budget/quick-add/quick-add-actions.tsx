import { StyleSheet, View } from "react-native";

import { FlowButton, space } from "@/ui/trove";

interface QuickAddActionsProps {
  /** The spending pushes the envelope over: offer to cover it straight after saving. */
  readonly over: boolean;
  readonly busy: boolean;
  readonly onSave: () => void;
  readonly onSaveAndCover: () => void;
}

/** "Save & cover it" (outline) beside "Save" when over; "Save" alone when it fits. */
export function QuickAddActions({ over, busy, onSave, onSaveAndCover }: QuickAddActionsProps) {
  return (
    <View style={styles.row}>
      {over ? (
        <FlowButton
          disabled={busy}
          label="Save & cover it"
          onPress={onSaveAndCover}
          size="pair"
          style={styles.slot}
          tone="outline"
        />
      ) : null}
      <FlowButton label="Save" loading={busy} onPress={onSave} size="bar" style={styles.slot} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: space[2] + 2 },
  slot: { flex: 1 },
});
