import { StyleSheet, View } from "react-native";

import { space } from "../tokens";
import { FlowButton } from "./flow-button";

export interface CtaStackAction {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export interface CtaStackProps {
  /** Full-width 54pt pill, Nunito 800 17. */
  primary: CtaStackAction & {
    tone?: "accent" | "negative";
    disabled?: boolean;
    loading?: boolean;
  };
  /** 44pt secondary text link under it, Nunito 700 15, e.g. "Not now". */
  link?: CtaStackAction;
  /** default 6pt between the two (intro, review) · tight 4pt (got paid sheet). */
  spacing?: "default" | "tight";
}

/** In-content call to action: a full-width primary pill with an optional quiet link below. */
export function CtaStack({ primary, link, spacing = "default" }: CtaStackProps) {
  const { tone = "accent", ...primaryAction } = primary;

  return (
    <View style={spacing === "tight" ? styles.tight : styles.stack}>
      <FlowButton {...primaryAction} size="cta" tone={tone} />
      {link ? <FlowButton {...link} size="link" tone="text" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { alignSelf: "stretch", gap: 6 },
  tight: { alignSelf: "stretch", gap: space[1] },
});
