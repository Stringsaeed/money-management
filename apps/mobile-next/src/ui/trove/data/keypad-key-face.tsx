import { Icon } from "../icon";
import { Text } from "../text";
import { DENSE_MAX_FONT_SCALE } from "../tokens";
import type { KeypadKey } from "./keypad-input";
import { keyStyles } from "./keypad-key-styles";

interface KeyFaceProps {
  keyName: KeypadKey;
  /** Character drawn on the decimal key. */
  decimalSeparator: string;
}

export function KeyFace({ keyName, decimalSeparator }: KeyFaceProps) {
  if (keyName === "backspace") return <Icon name="backspace" size={26} />;
  return (
    <Text maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={keyStyles.label} variant="amountLg">
      {keyName === "decimal" ? decimalSeparator : keyName}
    </Text>
  );
}
