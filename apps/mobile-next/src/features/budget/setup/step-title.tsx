import { StyleSheet, View } from "react-native";

import { space, Text } from "@/ui/trove";

interface StepTitleProps {
  readonly title: string;
  /** Lead-in under the title, e.g. "Each one becomes an envelope." */
  readonly intro?: string | null;
}

/** A setup step's 28/34 title, with an optional 15pt lead-in 4pt under it. */
export function StepTitle({ title, intro }: StepTitleProps) {
  const heading = (
    <Text accessibilityRole="header" variant="titleLg">
      {title}
    </Text>
  );
  if (!intro) return heading;
  return (
    <View style={styles.block}>
      {heading}
      <Text style={styles.intro} tone="secondary" variant="bodyMd">
        {intro}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: space[1] },
  intro: { lineHeight: 21 },
});
