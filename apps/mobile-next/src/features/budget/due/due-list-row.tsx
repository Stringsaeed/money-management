import { StyleSheet, Text as NativeText, View } from "react-native";

import {
  CategoryTile,
  colors,
  DENSE_MAX_FONT_SCALE,
  fonts,
  PressableScale,
  space,
} from "@/ui/trove";

import type { ToneCopy } from "./due-copy";

export interface DueListRowProps {
  /** Category icon (emoji or Trove icon name); null draws the neutral expense tile. */
  readonly icon: string | null;
  readonly name: string;
  readonly note: ToneCopy;
  /** Bare figure, e.g. "375.00" or "≈ 17,000". */
  readonly figure: string;
  /** Paid bills and the salary print their figure quietly. */
  readonly quiet?: boolean;
  /** e.g. "SUN 18 OCT". */
  readonly when: string;
  readonly accessibilityLabel: string;
  /** Opens Mark paid; absent for read-only rows. */
  readonly onPress?: () => void;
}

/** 62pt Due row: tile, name over a note, and the figure over when it is due. */
export function DueListRow({
  icon,
  name,
  note,
  figure,
  quiet = false,
  when,
  accessibilityLabel,
  onPress,
}: DueListRowProps) {
  const body = (
    <>
      {icon ? <CategoryTile icon={icon} round /> : <CategoryTile kind="expense" />}
      <View style={styles.copy}>
        <NativeText
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          numberOfLines={1}
          style={styles.name}
        >
          {name}
        </NativeText>
        <NativeText
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          numberOfLines={2}
          style={[styles.note, NOTE_TONE[note.tone]]}
        >
          {note.text}
        </NativeText>
      </View>
      <View style={styles.trailing}>
        <NativeText
          maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
          style={[styles.figure, quiet ? styles.quiet : null]}
        >
          {figure}
        </NativeText>
        <NativeText maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.when}>
          {when}
        </NativeText>
      </View>
    </>
  );
  if (!onPress) {
    return (
      <View accessibilityLabel={accessibilityLabel} accessible style={styles.row}>
        {body}
      </View>
    );
  }
  return (
    <PressableScale
      accessibilityHint="Opens Mark paid"
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      pressedStyle={styles.pressed}
      scaleOnPress={false}
      style={styles.row}
    >
      {body}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderBottomColor: colors.border.subtle,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: space[3],
    minHeight: 62,
    paddingVertical: space[2],
  },
  pressed: { opacity: 0.7 },
  copy: { flex: 1, minWidth: 0 },
  name: { color: colors.text.primary, fontFamily: fonts.bold, fontSize: 15, lineHeight: 20 },
  note: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  trailing: { alignItems: "flex-end" },
  figure: {
    color: colors.text.primary,
    fontFamily: fonts.monoMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  quiet: { color: colors.text.tertiary },
  when: { color: colors.text.tertiary, fontFamily: fonts.mono, fontSize: 11, lineHeight: 14 },
});

const NOTE_TONE = StyleSheet.create({
  secondary: { color: colors.text.secondary },
  tertiary: { color: colors.text.tertiary },
  warning: { color: colors.warning.text },
});
