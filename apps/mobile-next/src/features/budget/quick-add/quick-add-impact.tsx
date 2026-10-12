import { StyleSheet, View } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "@/ui/motion";
import { ImpactLine, motion, Text, troveTransition } from "@/ui/trove";

import type { Impact } from "./quick-add-model";

interface QuickAddImpactProps {
  readonly impact: Impact | null;
  /** Where a date outside this period lands; shown when there is no envelope impact to show. */
  readonly placementNote: string | null;
}

/** Board pill height, kept while empty so the figure above never jumps. */
const SLOT_HEIGHT = 28;

/** Under the figure: what this spending does to the envelope, or where its date puts it. */
export function QuickAddImpact({ impact, placementNote }: QuickAddImpactProps) {
  const reducedMotion = useReducedMotion();
  const key = impact ? (impact.over ? "over" : "ok") : placementNote ? "placement" : "none";
  return (
    <View style={styles.slot}>
      {key === "none" ? null : (
        <EaseView
          animate={{ opacity: 1, scale: 1 }}
          initialAnimate={{ opacity: 0, scale: 0.96 }}
          key={key}
          transition={troveTransition(reducedMotion, motion.base)}
        >
          {impact ? (
            <ImpactLine align="center" text={impact.text} tone={impact.over ? "over" : "ok"} />
          ) : (
            <Text
              accessibilityLiveRegion="polite"
              style={styles.note}
              tone="secondary"
              variant="bodySm"
            >
              {placementNote}
            </Text>
          )}
        </EaseView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { alignItems: "center", justifyContent: "center", minHeight: SLOT_HEIGHT },
  note: { textAlign: "center" },
});
