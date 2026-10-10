import * as Haptics from "expo-haptics";

/** Selection tick for a toggle or palette pick in a ledger editor. */
export const pickHaptic = () => {
  if (process.env.EXPO_OS === "ios") void Haptics.selectionAsync().catch(() => undefined);
};

/** Error buzz when an editor refuses to save. */
export const errorHaptic = () => {
  if (process.env.EXPO_OS === "ios")
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
};
