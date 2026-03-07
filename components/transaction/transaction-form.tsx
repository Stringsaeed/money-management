import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { ArrowLeftIcon, ArrowRightIcon, TrashIcon, WarningCircleIcon } from "phosphor-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { twMerge } from "tailwind-merge";

import { AccountPicker } from "@/components/account/account-picker";
import { CategoryPicker } from "@/components/category/category-picker";
import { TransactionAmountPad } from "@/components/transaction/transaction-amount-pad";
import { Text } from "@/components/ui/text";
import { useAccounts } from "@/hooks/use-accounts";
import { parseDate, today, toDateString } from "@/utils/date";
import type { TransactionType } from "@/types";

export interface TransactionFormData {
  type: TransactionType;
  amount: number;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  description: string;
  date: string;
  currency: string;
  originalAmount: number | null;
  originalCurrency: string | null;
  exchangeRate: number | null;
}

interface TransactionFormProps {
  initialData?: Partial<TransactionFormData>;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  submitLabel?: string;
  onDelete?: () => void;
}

interface TypeOption {
  value: TransactionType;
  label: string;
  emoji: string;
  color: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  { value: "expense", label: "Expense", emoji: "💸", color: "#DC2626" },
  { value: "income", label: "Income", emoji: "💰", color: "#16A34A" },
  { value: "transfer", label: "Transfer", emoji: "🔁", color: "#7C3AED" },
] as const;

const formatAmount = (cents: number) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);

const triggerErrorHaptic = () => {
  if (process.env.EXPO_OS === "ios") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
};

const shiftDate = (date: string, delta: number) => {
  const nextDate = parseDate(date);
  nextDate.setDate(nextDate.getDate() + delta);
  return toDateString(nextDate);
};

const isValidDateString = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = parseDate(value);
  return !Number.isNaN(parsed.getTime()) && toDateString(parsed) === value;
};

const getDisplayDateLabel = (value: string) => {
  const todayValue = today();
  const yesterdayValue = shiftDate(todayValue, -1);

  if (value === todayValue) {
    return "Today";
  }

  if (value === yesterdayValue) {
    return "Yesterday";
  }

  return parseDate(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const getValidationMessage = ({
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
  date: string;
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

  if (!isValidDateString(date)) {
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

interface TypeToggleProps {
  option: TypeOption;
  selected: boolean;
  onPress: () => void;
}

const TypeToggle = ({ option, selected, onPress }: TypeToggleProps) => (
  <Pressable
    accessibilityRole="button"
    className="flex-1 rounded-full px-3 py-2.5 active:opacity-85"
    onPress={onPress}
    style={{
      backgroundColor: selected ? "#111827" : "#F1F5F9",
    }}
  >
    <Text
      className="text-center text-sm font-semibold"
      style={{ color: selected ? "#FFFFFF" : "#64748B" }}
    >
      {option.label}
    </Text>
  </Pressable>
);

export function TransactionForm({
  initialData,
  onSubmit,
  submitLabel = "Save",
  onDelete,
}: TransactionFormProps) {
  const { data: accounts = [] } = useAccounts();
  const { height } = useWindowDimensions();

  const firstAccountId = accounts[0]?.id ?? "";
  const firstAccountCurrency = accounts[0]?.currency ?? "USD";

  const [type, setType] = useState<TransactionType>(initialData?.type ?? "expense");
  const [amount, setAmount] = useState(initialData?.amount ?? 0);
  const [accountId, setAccountId] = useState(initialData?.accountId ?? "");
  const [toAccountId, setToAccountId] = useState<string | null>(initialData?.toAccountId ?? null);
  const [categoryId, setCategoryId] = useState<string | null>(initialData?.categoryId ?? null);
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [date, setDate] = useState(initialData?.date ?? today());
  const [saving, setSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  const currentAccount = accounts.find((account) => account.id === accountId);
  const currency = currentAccount?.currency ?? initialData?.currency ?? firstAccountCurrency;
  const selectedType = TYPE_OPTIONS.find((option) => option.value === type) ?? TYPE_OPTIONS[0];
  const validationMessage = getValidationMessage({
    amount,
    accountId,
    type,
    toAccountId,
    date,
    hasAccounts: accounts.length > 0,
  });
  const tight = height < 720;

  const amountScale = useSharedValue(1);
  const animatedAmountStyle = useAnimatedStyle(() => ({
    transform: [{ scale: amountScale.value }],
  }));

  useEffect(() => {
    if (!accountId && firstAccountId) {
      setAccountId(firstAccountId);
    }
  }, [accountId, firstAccountId]);

  useEffect(() => {
    amountScale.value = withSequence(
      withTiming(1.03, { duration: 110 }),
      withTiming(1, { duration: 180 }),
    );
  }, [amount, amountScale]);

  useEffect(() => {
    setSubmissionError("");
  }, [type, amount, accountId, toAccountId, categoryId, description, date]);

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);

    if (nextType !== "transfer") {
      setToAccountId(null);
    }
  };

  const handleAccountChange = (nextAccountId: string) => {
    setAccountId(nextAccountId);

    if (nextAccountId === toAccountId) {
      setToAccountId(null);
    }
  };

  const handleBackspace = () => {
    setAmount((currentAmount) => Math.floor(currentAmount / 10));
  };

  const handleToAccountChange = (nextAccountId: string) => {
    setToAccountId(nextAccountId);
  };

  const handleSubmit = async () => {
    setShowValidation(true);

    if (validationMessage) {
      triggerErrorHaptic();
      return;
    }

    setSaving(true);

    try {
      await onSubmit({
        type,
        amount,
        accountId,
        toAccountId: type === "transfer" ? toAccountId : null,
        categoryId: type === "transfer" ? null : categoryId,
        description: description.trim(),
        date,
        currency,
        originalAmount: null,
        originalCurrency: null,
        exchangeRate: null,
      });
    } catch {
      setSubmissionError("Saving failed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#F5F2EC] pb-safe pt-safe"
    >
      <View className="flex-1 px-4 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="rounded-full bg-[#FCE7F3] px-3 py-1.5">
            <Text className="text-xs font-semibold uppercase tracking-[1.6px] text-[#BE185D]">
              ⚡ Fast capture
            </Text>
          </View>

          {onDelete ? (
            <Pressable
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-80"
              onPress={onDelete}
            >
              <TrashIcon color="#DC2626" size={18} weight="regular" />
            </Pressable>
          ) : (
            <View className="rounded-full bg-white px-3 py-1.5">
              <Text className="text-xs font-semibold text-gray-500">{submitLabel}</Text>
            </View>
          )}
        </View>

        <View
          className={twMerge(
            "mt-3 flex-row gap-2 rounded-full bg-white p-1.5",
            tight ? "mb-3" : "mb-4",
          )}
        >
          {TYPE_OPTIONS.map((option) => (
            <TypeToggle
              key={option.value}
              onPress={() => handleTypeChange(option.value)}
              option={option}
              selected={type === option.value}
            />
          ))}
        </View>

        <View className="flex-1 justify-between">
          <View className={twMerge("items-center", tight ? "pt-1" : "pt-3")}>
            <Animated.View className="items-center" style={animatedAmountStyle}>
              <View className="mb-3 rounded-full bg-white px-3 py-1.5">
                <Text className="text-xs font-semibold uppercase tracking-[1.4px] text-gray-500">
                  {selectedType.emoji} {currency}
                </Text>
              </View>

              <View className="flex-row items-end gap-2">
                <Text
                  className={twMerge("pb-1 text-gray-400", tight ? "text-[24px]" : "text-[28px]")}
                >
                  {currency === "USD" ? "$" : currency}
                </Text>
                <Text
                  className={twMerge(
                    "font-extrabold tabular-nums text-gray-950",
                    tight ? "text-[52px]" : "text-[60px]",
                  )}
                >
                  {formatAmount(amount)}
                </Text>
              </View>
            </Animated.View>

            <View className={twMerge("mt-4 w-full items-center", tight ? "gap-2" : "gap-3")}>
              <TextInput
                className={twMerge(
                  "w-[72%] rounded-full border border-white bg-white px-4 text-center text-sm text-gray-950",
                  tight ? "py-2.5" : "py-3",
                )}
                maxLength={36}
                onChangeText={setDescription}
                placeholder="Add a quick note ✍️"
                placeholderTextColor="#94A3B8"
                returnKeyType="done"
                value={description}
              />

              <View className="flex-row w-full items-center gap-2">
                <Pressable
                  accessibilityRole="button"
                  className="h-12 w-12 items-center justify-center rounded-2xl bg-white active:opacity-80"
                  onPress={() => setDate((currentDate) => shiftDate(currentDate, -1))}
                >
                  <ArrowLeftIcon color="#111827" size={18} weight="regular" />
                </Pressable>

                <View className="flex-1 rounded-[22px] bg-white px-4 py-3">
                  <Text className="text-xs font-semibold uppercase tracking-[1.3px] text-gray-400">
                    {getDisplayDateLabel(date)}
                  </Text>
                  <Text className="mt-1 text-base font-bold text-gray-950">{date}</Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  className="h-12 w-12 items-center justify-center rounded-2xl bg-white active:opacity-80"
                  onPress={() => setDate((currentDate) => shiftDate(currentDate, 1))}
                >
                  <ArrowRightIcon color="#111827" size={18} weight="regular" />
                </Pressable>
              </View>
            </View>
          </View>

          <View className={twMerge("gap-3", tight ? "pb-1" : "pb-2")}>
            <View className="rounded-[26px] bg-white px-3 py-3">
              <Text className="mb-2 text-[11px] font-semibold uppercase tracking-[1.2px] text-gray-400">
                From account
              </Text>
              <AccountPicker onChange={handleAccountChange} value={accountId} />
            </View>

            <View className="rounded-[26px] bg-white px-3 py-3">
              <Text className="mb-2 text-[11px] font-semibold uppercase tracking-[1.2px] text-gray-400">
                {type === "transfer" ? "Destination" : "Category"}
              </Text>
              {type === "transfer" ? (
                <AccountPicker
                  exclude={accountId ? [accountId] : []}
                  onChange={handleToAccountChange}
                  value={toAccountId}
                />
              ) : (
                <CategoryPicker
                  horizontal
                  onChange={setCategoryId}
                  type={type}
                  value={categoryId}
                />
              )}
            </View>

            {showValidation && (validationMessage || submissionError) ? (
              <View className="flex-row items-center gap-2 rounded-2xl bg-[#FEF3C7] px-3 py-2.5">
                <WarningCircleIcon color="#B45309" size={16} weight="fill" />
                <Text className="flex-1 text-xs font-semibold text-amber-800">
                  {submissionError || validationMessage}
                </Text>
              </View>
            ) : null}

            <TransactionAmountPad
              accentColor={selectedType.color}
              isSubmitting={saving}
              onBackspace={handleBackspace}
              onChangeCents={setAmount}
              onSubmit={handleSubmit}
              valueCents={amount}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
