import { useId, type ReactElement } from "react";
import { Platform, type KeyboardTypeOptions } from "react-native";

import { KeyboardDoneBar } from "./keyboard-done-bar";
import { keyboardNeedsDoneBar } from "./keyboard-utils";

export interface KeyboardAccessoryOptions {
  keyboardType?: KeyboardTypeOptions;
  /** A caller-supplied accessory wins: no Trove bar is rendered. */
  inputAccessoryViewID?: string;
  /** Force the bar on or off. Left undefined it follows `keyboardType`. */
  enabled?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
}

interface KeyboardAccessory {
  /** Pass to the TextInput. */
  inputAccessoryViewID: string | undefined;
  /** Render next to the TextInput. Null when no bar applies. */
  bar: ReactElement | null;
}

/** The `inputAccessoryViewID` plumbing for a TextInput that may show the done bar (iOS only). */
export function useKeyboardAccessory({
  keyboardType,
  inputAccessoryViewID,
  enabled,
  onPrevious,
  onNext,
}: KeyboardAccessoryOptions): KeyboardAccessory {
  const id = useId();
  if (inputAccessoryViewID !== undefined) return { inputAccessoryViewID, bar: null };
  const show = Platform.OS === "ios" && (enabled ?? keyboardNeedsDoneBar(keyboardType));
  if (!show) return { inputAccessoryViewID: undefined, bar: null };

  return {
    inputAccessoryViewID: id,
    bar: <KeyboardDoneBar nativeID={id} onNext={onNext} onPrevious={onPrevious} />,
  };
}
