import { router } from "expo-router";
import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, radius } from "@/ui/trove";

import { PaydayPill } from "./payday-pill";
import { raiseSentence } from "./wrap-up-copy";
import type { RaiseSuggestion } from "./wrap-up-model";

interface RaiseCardProps {
  readonly suggestion: RaiseSuggestion;
  readonly currency: string;
}

/** One gentle suggestion; Raise opens the envelope, where its plan changes. */
export function RaiseCard({ suggestion, currency }: RaiseCardProps) {
  return (
    <View style={styles.card}>
      <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.text}>
        {raiseSentence(suggestion, currency)}
      </NativeText>
      <PaydayPill
        accessibilityHint={`Opens ${suggestion.name} to change its plan`}
        appearance="filled"
        label="Raise"
        onPress={() =>
          router.push({ pathname: "/budget/envelope/[id]", params: { id: suggestion.envelopeId } })
        }
        size="md"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.surface.default,
    borderColor: colors.border.default,
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    // The board's ring takes no space: 12/12/12/14 from the outer edge.
    paddingBottom: 11,
    paddingLeft: 13,
    paddingRight: 11,
    paddingTop: 11,
  },
  text: {
    color: colors.text.primary,
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 20,
  },
});
