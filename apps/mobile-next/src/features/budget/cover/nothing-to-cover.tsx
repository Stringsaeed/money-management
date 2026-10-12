import { StyleSheet, View } from "react-native";

import { FlowButton, Text } from "@/ui/trove";

import { SheetHeading } from "../sheet-heading";

interface NothingToCoverProps {
  /** The envelope's name, when it still exists. */
  readonly name: string | undefined;
  readonly onDone: () => void;
}

/** Cover from… opened for an envelope that is no longer over (or no longer exists). */
export function NothingToCover({ name, onDone }: NothingToCoverProps) {
  return (
    <View style={styles.column}>
      <SheetHeading stamp={name ?? "Cover"} title="Nothing to cover" onClose={onDone} />
      <Text tone="secondary" variant="bodySm">
        This envelope is no longer over.
      </Text>
      <FlowButton label="Done" size="cta" tone="outline" onPress={onDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 14 },
});
