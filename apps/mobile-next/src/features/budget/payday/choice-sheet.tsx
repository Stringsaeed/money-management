import { StyleSheet, View } from "react-native";

import { RadioCard, Sheet } from "@/ui/trove";

export interface Choice {
  readonly id: string;
  readonly title: string;
  /** Mono figure on the right, e.g. an account's balance. */
  readonly trailing?: string;
  /** User emoji, e.g. a Saving for envelope's. */
  readonly emoji?: string;
}

interface ChoiceSheetProps {
  readonly open: boolean;
  readonly title: string;
  readonly choices: readonly Choice[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  readonly onDismiss: () => void;
}

/** A single choice from a short list, as radio cards in a sheet; picking one closes it. */
export function ChoiceSheet({
  open,
  title,
  choices,
  selectedId,
  onSelect,
  onDismiss,
}: ChoiceSheetProps) {
  return (
    <Sheet surface="canvas" onDismiss={onDismiss} open={open} title={title}>
      <View accessibilityRole="radiogroup" style={styles.list}>
        {choices.map((choice) => (
          <RadioCard
            emoji={choice.emoji}
            key={choice.id}
            onPress={() => {
              onSelect(choice.id);
              onDismiss();
            }}
            selected={choice.id === selectedId}
            title={choice.title}
            trailing={choice.trailing}
          />
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
});
