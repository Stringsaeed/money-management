import * as Haptics from "expo-haptics";

/** Light tap as the slider reaches 0, 50 or 100%. iOS only, like the app's other haptics. */
export const sliderDetentHaptic = () => {
  if (process.env.EXPO_OS === "ios") {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  }
};
