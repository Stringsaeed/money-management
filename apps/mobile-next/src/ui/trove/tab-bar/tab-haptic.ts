import * as Haptics from "expo-haptics";

/** Selection tick as the dragged selector crosses into another tab. iOS only, like the app's other haptics. */
export const tabCrossHaptic = () => {
  if (process.env.EXPO_OS === "ios") {
    void Haptics.selectionAsync().catch(() => undefined);
  }
};
