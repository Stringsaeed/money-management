import type { KeyboardTypeOptions } from "react-native";

/** Keyboards that have no return key, so they need the done bar to be dismissed. */
const KEYBOARDS_WITHOUT_RETURN = [
  "decimal-pad",
  "number-pad",
  "phone-pad",
  "email-address",
] as const satisfies readonly KeyboardTypeOptions[];

export const keyboardNeedsDoneBar = (keyboardType: KeyboardTypeOptions | undefined): boolean =>
  KEYBOARDS_WITHOUT_RETURN.some((type) => type === keyboardType);
