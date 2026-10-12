import { StyleSheet, Text as NativeText } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, RadioCard } from "@/ui/trove";

import { signedCompact } from "../envelope/envelope-figures";

import { coverSourceSub, type SourceGroup } from "./cover-display";
import type { CoverPlan } from "./cover-move-model";

interface CoverSourceGroupProps {
  readonly group: SourceGroup;
  readonly plan: CoverPlan;
  /** What the cover is for. */
  readonly amountMinor: number;
  readonly currency: string;
  readonly selected: readonly string[];
  readonly emojis: ReadonlyMap<string, string>;
  readonly onToggle: (key: string) => void;
}

/** One group of cover sources under its mono title: a 54pt card per place it can take from. */
export function CoverSourceGroup({
  group,
  plan,
  amountMinor,
  currency,
  selected,
  emojis,
  onToggle,
}: CoverSourceGroupProps) {
  return (
    <>
      <NativeText
        accessibilityRole="header"
        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
        style={styles.title}
      >
        {group.label}
      </NativeText>
      {group.places.map((place) => {
        const take = plan.takes.find((item) => item.place.key === place.key);
        const sub = coverSourceSub(place, take, amountMinor, currency);
        const trailing = signedCompact(place.availableMinor, currency);
        return (
          <RadioCard
            key={place.key}
            accessibilityLabel={`${place.name}, ${trailing} left, ${sub.text.toLowerCase()}`}
            emoji={emojis.get(place.key)}
            selected={selected.includes(place.key)}
            sub={sub.text}
            subStyle="mono"
            subTone={sub.tone}
            title={place.name}
            trailing={trailing}
            onPress={() => onToggle(place.key)}
          />
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  // Board: Plex Mono 600 10, 1.2 tracking, 6pt above; no Text variant is 10pt.
  title: {
    color: colors.text.tertiary,
    fontFamily: fonts.monoSemibold,
    fontSize: 10,
    letterSpacing: 1.2,
    lineHeight: 13,
    marginTop: 6,
  },
});
