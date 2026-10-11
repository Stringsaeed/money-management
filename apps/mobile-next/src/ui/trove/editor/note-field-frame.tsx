import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { colors, radius, space } from "../tokens";
import { noteRadius } from "./note-field-utils";

interface NoteFieldFrameProps {
  multiline: boolean;
  focused: boolean;
  /** Lines the text wraps to; the multiline radius steps from full to lg once above one. */
  lines: number;
  children: ReactNode;
}

/** The pill (or, once wrapped, rounded card) around a note: surface fill, ring that turns ink on focus. */
export function NoteFieldFrame({ multiline, focused, lines, children }: NoteFieldFrameProps) {
  return (
    <View
      style={[
        styles.frame,
        multiline ? styles.multiline : styles.single,
        focused ? styles.focused : styles.idle,
        { borderRadius: multiline ? noteRadius(lines) : radius.full },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: colors.surface.default,
    gap: space[2],
  },
  single: {
    justifyContent: "center",
    minHeight: 52,
    paddingLeft: space[5],
    paddingRight: space[2],
  },
  multiline: {
    paddingBottom: 10,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  idle: {
    borderColor: colors.border.default,
    borderWidth: 1,
  },
  focused: {
    borderColor: colors.text.primary,
    borderWidth: 1.5,
  },
});
