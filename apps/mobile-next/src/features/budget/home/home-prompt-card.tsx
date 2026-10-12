import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { colors, CtaStack, radius, Text, type CtaStackProps } from "@/ui/trove";

interface HomePromptCardProps {
  readonly title: string;
  readonly message: string;
  /** Fields between the copy and the actions, e.g. an amount input. */
  readonly children?: ReactNode;
  readonly primary: CtaStackProps["primary"];
  /** The quiet "Not now" link. */
  readonly link: NonNullable<CtaStackProps["link"]>;
}

/**
 * An opt-in card under Budget home's tickets (reminders, a second currency, the household
 * share). Drawn like the board's Safe to spend error card, with the intro's call to action.
 */
export function HomePromptCard({ title, message, children, primary, link }: HomePromptCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text accessibilityRole="header" variant="titleSm">
          {title}
        </Text>
        <Text tone="secondary">{message}</Text>
      </View>
      {children}
      <CtaStack link={link} primary={primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.default,
    borderColor: colors.border.default,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  copy: { gap: 6 },
});
