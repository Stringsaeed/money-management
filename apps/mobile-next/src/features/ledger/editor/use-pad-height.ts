import { useWindowDimensions } from "react-native";

// The field above an editor's pad must stay visible while typing, so the pad stays taller than
// the system keyboard (plus its suggestion bar) and the keyboard never covers that field.
const SCREEN_SHARE = 0.46;
const MIN_KEYBOARD_CLEARANCE = 340;

/** Height of the bottom pad (keypad, emoji grid) shared by the ledger's modal editors. */
export function usePadHeight(): number {
  const { height } = useWindowDimensions();
  return Math.max(height * SCREEN_SHARE, MIN_KEYBOARD_CLEARANCE);
}
