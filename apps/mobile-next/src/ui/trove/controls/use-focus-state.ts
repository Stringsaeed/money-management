import { useState } from "react";
import type { BlurEvent, FocusEvent } from "react-native";

type FocusHandler = (event: FocusEvent) => void;
type BlurHandler = (event: BlurEvent) => void;

/** Tracks focus for a text input while still forwarding the caller's own handlers. */
export function useFocusState(onFocus?: FocusHandler, onBlur?: BlurHandler) {
  const [focused, setFocused] = useState(false);

  return {
    focused,
    onFocus: (event: FocusEvent) => {
      setFocused(true);
      onFocus?.(event);
    },
    onBlur: (event: BlurEvent) => {
      setFocused(false);
      onBlur?.(event);
    },
  };
}
