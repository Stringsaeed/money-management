import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { colors, spacing } from "@/ui/design-tokens";
import { Screen } from "@/ui/screen";
import { Text } from "@/ui/text";

interface SetupFrameProps {
  readonly step: string;
  readonly title: string;
  readonly intro?: string;
  /** Pinned above the scrolling content. */
  readonly pinned?: ReactNode;
  /** Pinned below the scrolling content: the primary action. */
  readonly footer: ReactNode;
  readonly children: ReactNode;
}

/** The shared shell of setup screens 2 to 5: a step label, a title, scrolling content, and actions. */
export function SetupFrame({ step, title, intro, pinned, footer, children }: SetupFrameProps) {
  return (
    <Screen edges={["bottom"]}>
      {pinned}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Text variant="label">{step}</Text>
          <Text variant="headline">{title}</Text>
          {intro ? <Text variant="caption">{intro}</Text> : null}
        </View>
        {children}
      </ScrollView>
      <View style={styles.footer}>{footer}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing[5], padding: spacing[5] },
  heading: { gap: spacing[1] },
  footer: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing[2],
    padding: spacing[4],
  },
});
