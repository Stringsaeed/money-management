import * as Haptics from "expo-haptics";

/** Light tap for a keypad key press. Matches the app's iOS-only haptics guard. */
export const keyPressHaptic = () => {
  if (process.env.EXPO_OS === "ios") {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  }
};
