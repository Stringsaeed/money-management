import { StyleSheet, Text as NativeText, View } from "react-native";

import { BudgetPill, colors, DENSE_MAX_FONT_SCALE, fonts, radius, StatusPill } from "@/ui/trove";

import { PaydayPill } from "./payday-pill";
import { ACCEPTED_SUB, COVERED_SUB, OVERSPEND_SUB, overspendTitle } from "./wrap-up-copy";
import type { Overspend } from "./wrap-up-model";

export type OverspendResolution = "covered" | "accepted";

interface OverspendRowProps {
  readonly item: Overspend;
  readonly currency: string;
  readonly resolution: OverspendResolution | undefined;
  readonly onCover: () => void;
  readonly onAccept: () => void;
}

const SUB = { covered: COVERED_SUB, accepted: ACCEPTED_SUB } as const;
const DONE = { covered: "Covered ✓", accepted: "Accepted" } as const;

/**
 * An envelope that ended last month below zero, on a negative-tinted card with a 4pt edge: cover
 * it from this month's envelopes, or accept it. Once handled, a pill says which.
 */
export function OverspendRow({ item, currency, resolution, onCover, onAccept }: OverspendRowProps) {
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole={resolution ? undefined : "alert"}
      style={styles.card}
    >
      <View pointerEvents="none" style={styles.edge} />
      <View style={styles.texts}>
        <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.title}>
          {overspendTitle(item, currency)}
        </NativeText>
        <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.sub}>
          {resolution ? SUB[resolution] : OVERSPEND_SUB}
        </NativeText>
      </View>
      {resolution ? (
        <StatusPill label={DONE[resolution]} status="paid" />
      ) : (
        <>
          <PaydayPill
            accessibilityHint="Leaves it out of this month's envelopes"
            appearance="outline"
            label="Accept"
            onPress={onAccept}
            size="md"
          />
          <BudgetPill
            accessibilityHint={`Covers ${item.name} from this month's envelopes`}
            label="Cover"
            onPress={onCover}
            size="md"
            tone="neg"
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.negative.subtle,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    flexDirection: "row",
    gap: 10,
    overflow: "hidden",
    paddingBottom: 12,
    paddingLeft: 14,
    paddingRight: 12,
    paddingTop: 12,
  },
  edge: {
    backgroundColor: colors.negative.text,
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: 4,
  },
  texts: { flex: 1, minWidth: 0 },
  title: { color: colors.text.primary, fontFamily: fonts.extrabold, fontSize: 15, lineHeight: 20 },
  sub: { color: colors.text.secondary, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
});
