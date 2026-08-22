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

export const getDateDisplayValue = (date: Date): string => {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
