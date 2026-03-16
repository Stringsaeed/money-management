import { formatRelative, isValid } from "date-fns";
import * as Haptics from "expo-haptics";

import { TransactionType } from "@/types";

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

export const getValidationMessage = ({
  amount,
  accountId,
  type,
  toAccountId,
  date,
  hasAccounts,
}: {
  amount: number;
  accountId: string;
  type: TransactionType;
  toAccountId: string | null;
  date: Date;
  hasAccounts: boolean;
}) => {
  if (!hasAccounts) {
    return "Add an account first.";
  }

  if (amount <= 0) {
    return "Enter an amount above 0.00.";
  }

  if (!accountId) {
    return "Pick the source account.";
  }

  if (!isValid(date)) {
    return "Use a valid date.";
  }

  if (type === "transfer" && !toAccountId) {
    return "Choose where the transfer goes.";
  }

  if (type === "transfer" && toAccountId === accountId) {
    return "Transfer accounts must be different.";
  }

  return null;
};
