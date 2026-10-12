import { StyleSheet } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "@/ui/motion";
import { motion, SelectChip, troveTransition } from "@/ui/trove";

import { signedCompact } from "../envelope/envelope-figures";

import type { Place } from "./cover-move-model";

interface MovePlacePickerProps {
  /** "From" or "To", for the chips' spoken hint. */
  readonly end: string;
  readonly places: readonly Place[];
  readonly selectedKey: string | null;
  readonly emojis: ReadonlyMap<string, string>;
  readonly currency: string;
  readonly onSelect: (key: string) => void;
}

/** The places one end can take, as envelope chips with what each has left. */
export function MovePlacePicker({
  end,
  places,
  selectedKey,
  emojis,
  currency,
  onSelect,
}: MovePlacePickerProps) {
  const reducedMotion = useReducedMotion();
  return (
    <EaseView
      accessibilityLabel={`${end} envelope`}
      accessibilityRole="radiogroup"
      animate={{ opacity: 1, translateY: 0 }}
      initialAnimate={{ opacity: 0, translateY: -4 }}
      style={styles.chips}
      transition={troveTransition(reducedMotion, motion.base)}
    >
      {places.map((place) => (
        <SelectChip
          key={place.key}
          emoji={emojis.get(place.key)}
          label={place.name}
          meta={signedCompact(place.availableMinor, currency)}
          selected={place.key === selectedKey}
          size="md"
          variant="envelope"
          onPress={() => onSelect(place.key)}
        />
      ))}
    </EaseView>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
