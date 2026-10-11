import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { colors, layout, Screen, space, Text } from "@/ui/trove";

import { SetupHeader } from "./setup-header";

interface SetupFrameProps {
  /** Compact header title; setup steps keep the default. */
  readonly header?: string;
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
export function SetupFrame({
  header,
  step,
  title,
  intro,
  pinned,
  footer,
  children,
}: SetupFrameProps) {
  return (
    <Screen>
      <SetupHeader title={header} />
      {pinned}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Text tone="secondary" variant="labelSm">
            {step}
          </Text>
          <Text variant="titleLg">{title}</Text>
          {intro ? (
            <Text tone="secondary" variant="bodySm">
              {intro}
            </Text>
          ) : null}
        </View>
        {children}
      </ScrollView>
      <View style={styles.footer}>{footer}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space[5], padding: layout.screenGutter },
  heading: { gap: space[1] },
  footer: {
    borderTopColor: colors.border.subtle,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: space[2],
    padding: space[4],
  },
});
