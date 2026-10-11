import type { Ref } from "react";
import { StyleSheet, TextInput, type TextInputProps } from "react-native";

import { colors, layout, type } from "../tokens";
import { NOTE_LINE_HEIGHT, NOTE_MAX_LINES, NOTE_MAX_TEXT_HEIGHT } from "./note-field-utils";

interface NoteTextInputProps extends Omit<TextInputProps, "style" | "onFocus" | "onBlur"> {
  inputRef: Ref<TextInput>;
  /** Lines the text currently wraps to; the input scrolls once it reaches six. */
  lines: number;
  onFocusChange: (focused: boolean) => void;
}

/** The text input inside a note pill: one line, or a growing multiline area capped at six lines. */
export function NoteTextInput({
  inputRef,
  lines,
  onFocusChange,
  multiline = false,
  ...props
}: NoteTextInputProps) {
  return (
    <TextInput
      blurOnSubmit={!multiline}
      placeholderTextColor={colors.text.tertiary}
      returnKeyType={multiline ? "default" : "done"}
      selectionColor={colors.accent.fill}
      {...props}
      multiline={multiline}
      onBlur={() => onFocusChange(false)}
      onFocus={() => onFocusChange(true)}
      ref={inputRef}
      scrollEnabled={multiline && lines >= NOTE_MAX_LINES}
      style={[styles.input, multiline ? styles.multiline : null]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    color: colors.text.primary,
    flex: 1,
    fontFamily: type.bodyLg.fontFamily,
    fontSize: type.bodyLg.fontSize,
    lineHeight: NOTE_LINE_HEIGHT,
    minHeight: layout.minTouchTarget,
    minWidth: 0,
    paddingVertical: 0,
  },
  multiline: {
    fontSize: 16,
    maxHeight: NOTE_MAX_TEXT_HEIGHT,
    minHeight: NOTE_LINE_HEIGHT,
    textAlignVertical: "top",
  },
});
