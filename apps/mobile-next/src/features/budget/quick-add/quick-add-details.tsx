import { StyleSheet } from "react-native";
import { EaseView } from "react-native-ease";

import { useReducedMotion } from "@/ui/motion";
import { motion, troveTransition } from "@/ui/trove";

import { QuickAddDetailsBody } from "./quick-add-details-body";
import type { QuickAddDetailsProps } from "./quick-add-panel";

/** Board keypad height: four 48pt rows and three 4pt gaps; the editors keep at least that. */
export const PAD_HEIGHT = 204;

/** The editor a meta chip opens, in the keypad's place. */
export function QuickAddDetails(props: QuickAddDetailsProps) {
  const reducedMotion = useReducedMotion();
  return (
    <EaseView
      animate={{ opacity: 1, translateY: 0 }}
      initialAnimate={{ opacity: 0, translateY: 8 }}
      key={props.panel}
      style={styles.panel}
      transition={troveTransition(reducedMotion, motion.base)}
    >
      <QuickAddDetailsBody {...props} />
    </EaseView>
  );
}

const styles = StyleSheet.create({
  panel: { minHeight: PAD_HEIGHT },
});
