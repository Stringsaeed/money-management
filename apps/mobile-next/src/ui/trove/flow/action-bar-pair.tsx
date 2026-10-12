import { StyleSheet } from "react-native";

import type { ActionBarPrimary, ActionBarSecondary } from "./action-bar-types";
import { FlowButton } from "./flow-button";

interface ActionBarPairProps {
  primary: ActionBarPrimary;
  secondary: ActionBarSecondary;
}

/** Two buttons: outline + primary share the width at 16pt; text + primary split 1:2. */
export function ActionBarPair({ primary, secondary }: ActionBarPairProps) {
  const { appearance = "outline", ...secondaryAction } = secondary;
  const outline = appearance === "outline";

  return (
    <>
      <FlowButton
        {...secondaryAction}
        size="pair"
        style={styles.fill}
        tone={outline ? "outline" : "text"}
      />
      <FlowButton
        {...primary}
        size={outline ? "pair" : "bar"}
        style={outline ? styles.fill : styles.fillWide}
        tone={primary.tone ?? "accent"}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  fillWide: { flex: 2 },
});
