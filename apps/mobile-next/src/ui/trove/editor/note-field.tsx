import { StyleSheet, View, type TextInputProps } from "react-native";

import { Text } from "../text";
import { NoteClearButton } from "./note-clear-button";
import { NoteFieldFrame } from "./note-field-frame";
import { NoteCounter } from "./note-counter";
import { NOTE_LINE_HEIGHT } from "./note-field-utils";
import { NoteTextInput } from "./note-text-input";
import { useNoteField } from "./use-note-field";

export interface NoteFieldProps extends Omit<
  TextInputProps,
  "style" | "value" | "onChangeText" | "multiline" | "placeholder"
> {
  value: string;
  onChangeText: (value: string) => void;
  /** Defaults to "Add a note…". */
  placeholder?: string;
  /** Decorative leading emoji: the field's icon. */
  emoji?: string;
  /** Grows from one line to six, then scrolls; the radius steps to lg once it wraps. */
  multiline?: boolean;
  clearLabel?: string;
}

/**
 * Inline note field: a 52pt pill with a decorative emoji, a ring that turns ink on focus and a
 * clear button while it holds text. Return closes the single-line field; `multiline` is for long notes.
 */
export function NoteField({
  value,
  onChangeText,
  placeholder = "Add a note…",
  emoji = "📝",
  multiline = false,
  clearLabel = "Clear note",
  ...props
}: NoteFieldProps) {
  const field = useNoteField(onChangeText);

  return (
    <NoteFieldFrame focused={field.focused} lines={field.lines} multiline={multiline}>
      <View style={[styles.row, multiline ? styles.rowTop : null]}>
        <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.emoji}>
          {emoji}
        </Text>
        <NoteTextInput
          accessibilityLabel={placeholder}
          {...props}
          inputRef={field.input}
          lines={field.lines}
          multiline={multiline}
          onChangeText={onChangeText}
          onContentSizeChange={multiline ? field.onContentSizeChange : undefined}
          onFocusChange={field.setFocused}
          placeholder={placeholder}
          value={value}
        />
        {!multiline && value !== "" ? (
          <NoteClearButton label={clearLabel} onPress={field.clear} />
        ) : null}
      </View>
      {multiline ? <NoteCounter length={value.length} maxLength={props.maxLength} /> : null}
    </NoteFieldFrame>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  rowTop: { alignItems: "flex-start" },
  emoji: {
    fontSize: 18,
    lineHeight: NOTE_LINE_HEIGHT,
  },
});
