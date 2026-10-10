import { StyleSheet } from "react-native";

import { Text } from "../text";
import { fonts } from "../tokens";
import { noteCounter } from "./note-field-utils";

interface NoteCounterProps {
  length: number;
  /** No limit, no counter. */
  maxLength?: number;
}

/** "84 / 280", right-aligned under a multiline note. */
export function NoteCounter({ length, maxLength }: NoteCounterProps) {
  if (maxLength === undefined) return null;
  return (
    <Text style={styles.counter} tone="tertiary" variant="stamp">
      {noteCounter(length, maxLength)}
    </Text>
  );
}

const styles = StyleSheet.create({
  counter: {
    alignSelf: "flex-end",
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 0,
    lineHeight: 16,
    textTransform: "none",
  },
});
