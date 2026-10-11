import { useRef, useState } from "react";
import type { TextInput, TextInputContentSizeChangeEvent } from "react-native";

import { noteLineCount } from "./note-field-utils";

/** Focus, wrapped-line count and clear behaviour for `NoteField`. */
export function useNoteField(onChangeText: (value: string) => void) {
  const input = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const [lines, setLines] = useState(1);

  return {
    input,
    focused,
    lines,
    setFocused,
    onContentSizeChange: (event: TextInputContentSizeChangeEvent) =>
      setLines(noteLineCount(event.nativeEvent.contentSize.height)),
    clear: () => {
      onChangeText("");
      input.current?.focus();
    },
  };
}
