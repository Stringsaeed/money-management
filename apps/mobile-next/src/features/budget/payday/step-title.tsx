import { StyleSheet, Text as NativeText, View } from "react-native";

import { colors, DENSE_MAX_FONT_SCALE, fonts, Text } from "@/ui/trove";

interface StepTitleProps {
  readonly title: string;
  /** Mono line under the title, e.g. "25 SEP – 24 OCT". */
  readonly meta: string;
  /** Optional sentence under the meta line. */
  readonly note?: string;
}

/** A payday step's title (Nunito 800 28/34) over its mono date stamp. */
export function StepTitle({ title, meta, note }: StepTitleProps) {
  return (
    <View style={styles.block}>
      <Text accessibilityRole="header" variant="titleLg">
        {title}
      </Text>
      <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.meta}>
        {meta}
      </NativeText>
      {note ? (
        <Text style={styles.note} tone="secondary" variant="bodySm">
          {note}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 2 },
  meta: { color: colors.text.secondary, fontFamily: fonts.mono, fontSize: 12, lineHeight: 16 },
  note: { marginTop: 4 },
});
