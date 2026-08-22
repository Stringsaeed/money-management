import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

/**
 * Tracks keyboard visibility so tall decorative content can step aside.
 *
 * iOS gets the `Will` events so the collapse runs alongside the keyboard
 * slide-up; Android only emits the `Did` pair.
 */
export function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isIOS = Platform.OS === "ios";
    const show = Keyboard.addListener(isIOS ? "keyboardWillShow" : "keyboardDidShow", () =>
      setVisible(true),
    );
    const hide = Keyboard.addListener(isIOS ? "keyboardWillHide" : "keyboardDidHide", () =>
      setVisible(false),
    );

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return visible;
}
