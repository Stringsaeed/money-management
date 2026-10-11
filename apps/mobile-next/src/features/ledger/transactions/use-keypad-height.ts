import { useWindowDimensions } from "react-native";

// The note field above the keypad must stay visible while typing, so the pad stays taller than
// the system keyboard (plus its suggestion bar) and the keyboard never covers that field.
const SCREEN_SHARE = 0.46;
const MIN_KEYBOARD_CLEARANCE = 340;

/** Height reserved for the transaction editor's keypad. */
export function useKeypadHeight(): number {
  const { height } = useWindowDimensions();
  return Math.max(height * SCREEN_SHARE, MIN_KEYBOARD_CLEARANCE);
}
