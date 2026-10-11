import { Pressable, StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import { colors, radii, spacing } from "@/ui/design-tokens";
import { Icon } from "@/ui/icon";
import { Text } from "@/ui/text";
import { formatMoneyMinor } from "@/utils/money";

import type { CoverTake, Place } from "./cover-move-model";

interface CoverSourceRowProps {
  readonly place: Place;
  readonly selected: boolean;
  /** What this source gives and has left afterwards; only when it is part of the cover. */
  readonly take: CoverTake | undefined;
  readonly onToggle: () => void;
}

const money = (minor: number) => formatMoneyMinor(minor, BUDGET_CURRENCY);

/** One place a cover can come from, with its Left and the "After:" preview. */
export function CoverSourceRow({ place, selected, take, onToggle }: CoverSourceRowProps) {
  const left =
    place.kind === "unplanned"
      ? `${money(place.availableMinor)} not planned`
      : `${money(place.availableMinor)} left`;
  const after = take
    ? `After: ${money(take.afterMinor)}${place.kind === "unplanned" ? " not planned" : " left"}`
    : null;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${place.name}${place.kind === "saving" ? ", savings" : ""}, ${left}${after ? `. ${after}` : ""}`}
      onPress={onToggle}
      style={({ pressed }) => [styles.row, selected && styles.selected, pressed && styles.pressed]}
    >
      <View style={styles.copy}>
        <Text variant="body">{place.name}</Text>
        <Text variant="caption">{place.kind === "saving" ? `savings · ${left}` : left}</Text>
        {after ? <Text variant="label">{after}</Text> : null}
      </View>
      {selected ? <Icon name="check" size={20} color={colors.foreground} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: "transparent",
    borderCurve: "continuous",
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[3],
    justifyContent: "space-between",
    padding: spacing[4],
  },
  selected: { borderColor: colors.foreground },
  pressed: { backgroundColor: colors.surfaceDim },
  copy: { flex: 1, gap: spacing[1] },
});
