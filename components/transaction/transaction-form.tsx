import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { ArrowLeftIcon, ArrowRightIcon, TrashIcon, WarningCircleIcon } from "phosphor-react-native";
import { Card } from "heroui-native/card";
import { Chip } from "heroui-native/chip";
import { CloseButton } from "heroui-native/close-button";
import { Input } from "heroui-native/input";
import { twMerge } from "tailwind-merge";

import AnimatedPrice from "@/components/ui/animated-price";
import NumberPad from "@/components/transaction/num-pad";
import { Text } from "@/components/ui/text";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import useNumPadNumber from "@/hooks/use-num-pad-number";
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
  { value: "expense", label: "Expense", emoji: "💸", color: "#4F46E5" },
  { value: "income", label: "Income", emoji: "💰", color: "#16A34A" },
  { value: "transfer", label: "Transfer", emoji: "🔁", color: "#0EA5E9" },
] as const;

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

const getCurrencySymbol = (currency: string) => {
  const currencyPart = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .formatToParts(0)
    .find((part) => part.type === "currency");

  return currencyPart?.value ?? currency;
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

interface TypeChipProps {
  option: TypeOption;
  selected: boolean;
  onPress: () => void;
}

const TypeChip = ({ option, selected, onPress }: TypeChipProps) => (
  <Chip
    animation="disable-all"
    className={twMerge(
      "rounded-full border px-4",
      selected ? "border-transparent" : "border-white/10 bg-[#141417]",
    )}
    onPress={onPress}
    style={{
      backgroundColor: selected ? option.color : "#141417",
    }}
    variant="secondary"
  >
    <Chip.Label className="font-semibold text-white">
      {option.emoji} {option.label}
    </Chip.Label>
  </Chip>
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
  const [accountId, setAccountId] = useState(initialData?.accountId ?? "");
  const [toAccountId, setToAccountId] = useState<string | null>(initialData?.toAccountId ?? null);
  const [categoryId, setCategoryId] = useState<string | null>(initialData?.categoryId ?? null);
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [date, setDate] = useState(initialData?.date ?? today());
  const [saving, setSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const { data: categories = [] } = useCategories(type === "income" ? "income" : "expense");

  const numPad = useNumPadNumber((initialData?.amount ?? 0) / 100);
  const amountCents = Math.round(numPad.value * 100);

  const currentAccount = accounts.find((account) => account.id === accountId);
  const currentCategory = categories.find((category) => category.id === categoryId);
  const currentDestinationAccount = accounts.find((account) => account.id === toAccountId);
  const currency = currentAccount?.currency ?? initialData?.currency ?? firstAccountCurrency;
  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency]);
  const selectedType = TYPE_OPTIONS.find((option) => option.value === type) ?? TYPE_OPTIONS[0];
  const validationMessage = getValidationMessage({
    amount: amountCents,
    accountId,
    type,
    toAccountId,
    date,
    hasAccounts: accounts.length > 0,
  });
  const tight = height < 760;

  useEffect(() => {
    if (!accountId && firstAccountId) {
      setAccountId(firstAccountId);
    }
  }, [accountId, firstAccountId]);

  useEffect(() => {
    setSubmissionError("");
  }, [type, amountCents, accountId, toAccountId, categoryId, description, date]);

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
        amount: amountCents,
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
      className="flex-1 bg-[#050505] pb-safe pt-safe"
    >
      <View className="flex-1 px-4 pb-4">
        <View className="flex-row items-center justify-between">
          <CloseButton
            className="bg-white/8"
            iconProps={{ color: "#FFFFFF", size: 18 }}
            onPress={() => router.back()}
          />

          <View className="flex-row items-center gap-2">
            <Chip animation="disable-all" className="bg-white/8" variant="secondary">
              <Chip.Label className="font-semibold text-white">
                📅 {getDisplayDateLabel(date)}
              </Chip.Label>
            </Chip>

            {onDelete ? (
              <Chip
                animation="disable-all"
                className="bg-[#2B1111]"
                color="danger"
                onPress={onDelete}
                variant="secondary"
              >
                <TrashIcon color="#F87171" size={14} weight="regular" />
                <Chip.Label className="font-semibold text-red-300">Delete</Chip.Label>
              </Chip>
            ) : null}
          </View>
        </View>

        <View
          className={twMerge(
            "mt-4 flex-row items-center justify-center gap-2",
            tight ? "mb-3" : "mb-5",
          )}
        >
          {TYPE_OPTIONS.map((option) => (
            <TypeChip
              key={option.value}
              onPress={() => handleTypeChange(option.value)}
              option={option}
              selected={type === option.value}
            />
          ))}
        </View>

        <View className="flex-1 justify-between">
          <View className={twMerge("flex-1 items-center justify-center", tight ? "pt-1" : "pt-3")}>
            <AnimatedPrice currency={currencySymbol} size={tight ? 68 : 78}>
              {numPad.displayValue}
            </AnimatedPrice>

            <Text className="mt-3 text-center text-sm leading-6 text-white/45">
              Capture the amount first, then lock in the context below.
            </Text>
          </View>

          <Card className="rounded-[32px] border border-white/6 bg-[#0E0F12]">
            <Card.Body className="gap-3 p-3">
              <View className="gap-1">
                <Text className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/35">
                  Note
                </Text>
                <Input
                  className="border-transparent bg-[#17181D] px-4 text-white"
                  onChangeText={setDescription}
                  placeholder="Flight ticket"
                  placeholderColorClassName="text-white/25"
                  value={description}
                />
              </View>

              <View className="flex-row items-center gap-2">
                <Pressable
                  accessibilityRole="button"
                  className="h-11 w-11 items-center justify-center rounded-2xl bg-white/8 active:opacity-80"
                  onPress={() => setDate((currentDate) => shiftDate(currentDate, -1))}
                >
                  <ArrowLeftIcon color="#FFFFFF" size={18} weight="regular" />
                </Pressable>

                <Chip
                  animation="disable-all"
                  className="flex-1 bg-white/8 px-2"
                  variant="secondary"
                >
                  <Chip.Label className="text-center font-semibold text-white">
                    {getDisplayDateLabel(date)} · {date}
                  </Chip.Label>
                </Chip>

                <Pressable
                  accessibilityRole="button"
                  className="h-11 w-11 items-center justify-center rounded-2xl bg-white/8 active:opacity-80"
                  onPress={() => setDate((currentDate) => shiftDate(currentDate, 1))}
                >
                  <ArrowRightIcon color="#FFFFFF" size={18} weight="regular" />
                </Pressable>
              </View>

              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-row flex-1 items-center gap-2">
                  {currentAccount ? (
                    <Chip animation="disable-all" className="bg-white/8" variant="secondary">
                      <Chip.Label className="font-semibold text-white">
                        🏦 {currentAccount.name}
                      </Chip.Label>
                    </Chip>
                  ) : null}

                  {type === "transfer" && currentDestinationAccount ? (
                    <Chip animation="disable-all" className="bg-white/8" variant="secondary">
                      <Chip.Label className="font-semibold text-white">
                        🔁 {currentDestinationAccount.name}
                      </Chip.Label>
                    </Chip>
                  ) : null}

                  {type !== "transfer" && currentCategory ? (
                    <Chip animation="disable-all" className="bg-[#1B2C55]" variant="secondary">
                      <Chip.Label className="font-semibold text-blue-200">
                        {currentCategory.icon} {currentCategory.name}
                      </Chip.Label>
                    </Chip>
                  ) : null}
                </View>

                <Chip
                  animation="disable-all"
                  className="bg-white px-4"
                  isDisabled={saving}
                  onPress={handleSubmit}
                  variant="secondary"
                >
                  <Chip.Label className="font-bold text-black">
                    {saving ? "Saving..." : submitLabel}
                  </Chip.Label>
                </Chip>
              </View>

              <View className="gap-2">
                <Text className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/35">
                  From account
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-2"
                >
                  {accounts.map((account) => (
                    <Chip
                      key={account.id}
                      animation="disable-all"
                      className="px-3"
                      onPress={() => handleAccountChange(account.id)}
                      style={{
                        backgroundColor:
                          account.id === accountId ? `${selectedType.color}33` : "#17181D",
                        borderColor: account.id === accountId ? selectedType.color : "#1F2937",
                        borderWidth: 1,
                      }}
                      variant="secondary"
                    >
                      <Chip.Label
                        className={
                          account.id === accountId ? "font-semibold text-white" : "text-white/65"
                        }
                      >
                        {account.name}
                      </Chip.Label>
                    </Chip>
                  ))}
                </ScrollView>
              </View>

              <View className="gap-2">
                <Text className="text-[11px] font-semibold uppercase tracking-[1.2px] text-white/35">
                  {type === "transfer" ? "Destination" : "Category"}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="gap-2"
                >
                  {type === "transfer"
                    ? accounts
                        .filter((account) => account.id !== accountId)
                        .map((account) => (
                          <Chip
                            key={account.id}
                            animation="disable-all"
                            className="px-3"
                            onPress={() => setToAccountId(account.id)}
                            style={{
                              backgroundColor:
                                account.id === toAccountId ? `${selectedType.color}33` : "#17181D",
                              borderColor:
                                account.id === toAccountId ? selectedType.color : "#1F2937",
                              borderWidth: 1,
                            }}
                            variant="secondary"
                          >
                            <Chip.Label
                              className={
                                account.id === toAccountId
                                  ? "font-semibold text-white"
                                  : "text-white/65"
                              }
                            >
                              {account.name}
                            </Chip.Label>
                          </Chip>
                        ))
                    : categories.map((category) => (
                        <Chip
                          key={category.id}
                          animation="disable-all"
                          className="px-3"
                          onPress={() =>
                            setCategoryId(category.id === categoryId ? null : category.id)
                          }
                          style={{
                            backgroundColor:
                              category.id === categoryId ? `${selectedType.color}33` : "#17181D",
                            borderColor:
                              category.id === categoryId ? selectedType.color : "#1F2937",
                            borderWidth: 1,
                          }}
                          variant="secondary"
                        >
                          <Chip.Label
                            className={
                              category.id === categoryId
                                ? "font-semibold text-white"
                                : "text-white/65"
                            }
                          >
                            {category.icon} {category.name}
                          </Chip.Label>
                        </Chip>
                      ))}
                </ScrollView>
              </View>

              {showValidation && (validationMessage || submissionError) ? (
                <View className="flex-row items-center gap-2 rounded-2xl bg-[#271B09] px-3 py-2.5">
                  <WarningCircleIcon color="#FBBF24" size={16} weight="fill" />
                  <Text className="flex-1 text-xs font-semibold text-amber-200">
                    {submissionError || validationMessage}
                  </Text>
                </View>
              ) : null}
            </Card.Body>
          </Card>

          <View className={twMerge("w-full", tight ? "mt-2" : "mt-3")}>
            <NumberPad
              onClear={numPad.clearAll}
              onDelete={numPad.deleteDigit}
              onDot={numPad.addDecimalPoint}
              onPress={numPad.appendDigit}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
