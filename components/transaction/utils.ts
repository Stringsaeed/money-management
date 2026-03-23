import { formatRelative } from "date-fns";
import * as Haptics from "expo-haptics";

export const triggerErrorHaptic = () => {
  if (process.env.EXPO_OS === "ios") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
};

export const getDisplayDateLabel = (value: Date) => {
  return formatRelative(value, new Date());
};

export const getCurrencySymbol = (currency: string) => {
  const currencyMap: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CNY: "¥",
    INR: "₹",
    KRW: "₩",
    RUB: "₽",
    BRL: "R$",
    ZAR: "R",
  };

  return currencyMap[currency] ?? currency;
};
