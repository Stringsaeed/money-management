import { StyleSheet } from "react-native";

import { DENSE_MAX_FONT_SCALE, Text, type TextTone } from "@/ui/trove";

interface DueSectionTitleProps {
  /** e.g. "Today · 1"; printed in caps. */
  readonly label: string;
  readonly tone?: Extract<TextTone, "tertiary" | "warning" | "negative">;
  /** Space under the title: 4 above a list, 0 when the section's own gap spaces it. */
  readonly spaced?: boolean;
}

/** Mono section stamp of the Due list: TODAY · 1, THIS WEEK, PAID THIS MONTH · 2. */
export function DueSectionTitle({
  label,
  tone = "tertiary",
  spaced = false,
}: DueSectionTitleProps) {
  return (
    <Text
      accessibilityRole="header"
      maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
      style={spaced ? styles.spaced : null}
      tone={tone}
      variant="stamp"
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({ spaced: { marginBottom: 4 } });
