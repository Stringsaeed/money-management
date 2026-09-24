import * as Haptics from "expo-haptics";

export const keyHaptic = () => {
  if (process.env.EXPO_OS === "ios") void Haptics.selectionAsync().catch(() => undefined);
};

export const errorHaptic = () => {
  if (process.env.EXPO_OS === "ios")
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
};
