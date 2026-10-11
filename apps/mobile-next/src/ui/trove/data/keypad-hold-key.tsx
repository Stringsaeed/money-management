import { Pressable, View } from "react-native";

import { keyClearHaptic, keyPressHaptic } from "./keypad-haptic";
import { useHoldToClear } from "./keypad-hold";
import { KeypadHoldRing } from "./keypad-hold-ring";
import type { KeypadKey } from "./keypad-input";
import { KeyFace } from "./keypad-key-face";
import { keyStyles } from "./keypad-key-styles";

interface KeypadHoldKeyProps {
  decimalSeparator: string;
  fill: boolean;
  canClear: boolean;
  onPress: (key: KeypadKey) => void;
  onClear: () => void;
}

const CLEAR_ACTIONS = [{ name: "longpress", label: "Clear amount" }];

/**
 * The delete key with hold-to-clear: a tap deletes one digit, holding draws a ring for 600 ms
 * and then clears with a medium haptic. Screen readers get the same through a "longpress" action.
 */
export function KeypadHoldKey({
  decimalSeparator,
  fill,
  canClear,
  onPress,
  onClear,
}: KeypadHoldKeyProps) {
  const clear = () => {
    keyClearHaptic();
    onClear();
  };
  const hold = useHoldToClear({ enabled: canClear, onClear: clear });

  return (
    <View style={keyStyles.cell}>
      <Pressable
        accessibilityActions={CLEAR_ACTIONS}
        accessibilityHint="Hold to clear"
        accessibilityLabel="Delete"
        accessibilityRole="button"
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "longpress" && canClear) clear();
        }}
        onPress={() => {
          if (hold.consumeFired()) return;
          keyPressHaptic();
          onPress("backspace");
        }}
        onPressIn={hold.start}
        onPressOut={hold.release}
        pressRetentionOffset={12}
        style={({ pressed }) => [
          keyStyles.key,
          fill ? keyStyles.keyFill : null,
          pressed ? keyStyles.pressed : null,
        ]}
      >
        <KeypadHoldRing progress={hold.progress} />
        <KeyFace decimalSeparator={decimalSeparator} keyName="backspace" />
      </Pressable>
    </View>
  );
}
