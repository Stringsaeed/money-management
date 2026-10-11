import { InputAccessoryView, Keyboard, Platform } from "react-native";

import { colors } from "../tokens";
import {
  KeyboardDoneBarToolbar,
  type KeyboardDoneBarToolbarProps,
} from "./keyboard-done-bar-toolbar";

export interface KeyboardDoneBarProps extends Omit<KeyboardDoneBarToolbarProps, "onDone"> {
  /** Matches the `inputAccessoryViewID` of the inputs that show this bar. */
  nativeID: string;
  /** Defaults to dismissing the keyboard. */
  onDone?: () => void;
}

/**
 * iOS input accessory above number pads and email keyboards, which have no return key:
 * previous / next field and Done. Renders nothing on other platforms. Fields that use the
 * Trove number pad never attach it. `TextField`, `AmountInput` and `SearchField` wire it
 * automatically; use this directly only for a custom input.
 */
export function KeyboardDoneBar({
  nativeID,
  onDone = Keyboard.dismiss,
  ...toolbar
}: KeyboardDoneBarProps) {
  if (Platform.OS !== "ios") return null;

  return (
    <InputAccessoryView backgroundColor={colors.surface.raised} nativeID={nativeID}>
      <KeyboardDoneBarToolbar {...toolbar} onDone={onDone} />
    </InputAccessoryView>
  );
}
