import { StyleSheet } from "react-native";

import { Text } from "@/ui/trove";

/** How many bills are hidden until tomorrow; nothing when none are. */
export function DueSnoozedNote({ count }: { readonly count: number }) {
  if (count === 0) return null;
  return (
    <Text style={styles.note} tone="secondary" variant="bodySm">
      {count} {count === 1 ? "bill is" : "bills are"} snoozed until tomorrow.
    </Text>
  );
}

const styles = StyleSheet.create({ note: { textAlign: "center" } });
