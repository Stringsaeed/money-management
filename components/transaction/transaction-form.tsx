import * as Haptics from "expo-haptics";
import { type ReactNode, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  WarningCircleIcon,
} from "phosphor-react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeOutDown,
  LinearTransition,
} from "react-native-reanimated";

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

interface SectionCardProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

interface TypeOption {
  value: TransactionType;
  label: string;
  emoji: string;
  color: string;
  helper: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    value: "expense",
    label: "Expense",
    emoji: "💸",
    color: "#DC2626",
    helper: "Money heading out.",
  },
  {
    value: "income",
    label: "Income",
    emoji: "✨",
    color: "#16A34A",
    helper: "Money coming in.",
  },
  {
    value: "transfer",
    label: "Transfer",
    emoji: "🔁",
    color: "#7C3AED",
    helper: "Move between accounts.",
  },
] as const;

const DATE_SHORTCUTS = [
  { label: "Today", emoji: "☀️", resolve: () => today() },
  {
    label: "Yesterday",
    emoji: "🌙",
    resolve: () => shiftDate(today(), -1),
  },
] as const;

const FORM_LAYOUT = LinearTransition.easing(Easing.out(Easing.cubic));

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
    weekday: "short",
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
    return "Add an account first so this transaction has somewhere to land.";
  }

  if (amount <= 0) {
    return "Enter an amount above 0.00 before saving.";
  }

  if (!accountId) {
    return "Choose the account this transaction belongs to.";
  }

  if (!isValidDateString(date)) {
    return "Pick a valid transaction date before saving.";
  }

  if (type === "transfer" && !toAccountId) {
    return "Choose a destination account for this transfer.";
  }

  if (type === "transfer" && toAccountId === accountId) {
    return "Transfers need two different accounts.";
  }

  return null;
};

const SectionCard = ({ eyebrow, title, description, children }: SectionCardProps) => (
  <View className="gap-3 rounded-[28px] bg-white px-4 py-4">
    <View className="gap-1">
      <Text className="text-xs font-semibold uppercase tracking-[1.4px] text-gray-400">
        {eyebrow}
      </Text>
      <Text className="text-[19px] font-bold text-gray-950">{title}</Text>
      <Text className="text-sm leading-6 text-gray-500">{description}</Text>
    </View>
    {children}
  </View>
);

interface TypePillProps {
  option: TypeOption;
  selected: boolean;
  onPress: () => void;
}

const TypePill = ({ option, selected, onPress }: TypePillProps) => (
  <Pressable
    accessibilityRole="button"
    className="flex-1 rounded-[24px] border px-3 py-3 active:opacity-85"
    onPress={onPress}
    style={{
      backgroundColor: selected ? `${option.color}16` : "#F8FAFC",
      borderColor: selected ? option.color : "#E2E8F0",
    }}
  >
    <View className="gap-1">
      <Text
        className="text-base font-semibold"
        style={{ color: selected ? option.color : "#111827" }}
      >
        {option.emoji} {option.label}
      </Text>
      <Text className="text-xs leading-5" style={{ color: selected ? option.color : "#6B7280" }}>
        {option.helper}
      </Text>
    </View>
  </Pressable>
);

interface DateShortcutProps {
  label: string;
  emoji: string;
  selected: boolean;
  onPress: () => void;
}

const DateShortcut = ({ label, emoji, selected, onPress }: DateShortcutProps) => (
  <Pressable
    accessibilityRole="button"
    className="rounded-full border px-3.5 py-2 active:opacity-85"
    onPress={onPress}
    style={{
      backgroundColor: selected ? "#111827" : "#F8FAFC",
      borderColor: selected ? "#111827" : "#E2E8F0",
    }}
  >
    <Text className="text-sm font-semibold" style={{ color: selected ? "#FFFFFF" : "#475569" }}>
      {emoji} {label}
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

  useEffect(() => {
    if (!accountId && firstAccountId) {
      setAccountId(firstAccountId);
    }
  }, [accountId, firstAccountId]);

  useEffect(() => {
    setSubmissionError("");
  }, [type, amount, accountId, toAccountId, categoryId, description, date]);

  const handleAmountChange = (nextAmount: number) => {
    setAmount(nextAmount);
  };

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
      setSubmissionError("Saving failed. Nothing was lost, so you can try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-neutral-950 pb-safe pt-safe"
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-4 pb-6 pt-3"
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-1 px-1">
          <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-white/45">
            ⚡ Quick capture
          </Text>
          <Text className="text-[32px] font-extrabold text-white">
            {selectedType.emoji} {submitLabel}
          </Text>
          <Text className="text-sm leading-6 text-white/60">
            Dial the amount first, then lock in the details below.
          </Text>
        </View>

        <TransactionAmountPad
          accentColor={selectedType.color}
          currency={currency}
          onChangeCents={handleAmountChange}
          validationMessage={showValidation ? validationMessage : null}
          valueCents={amount}
        />

        <Animated.View className="gap-4" layout={FORM_LAYOUT}>
          <SectionCard
            description="Choose the motion of money so the form only shows what matters."
            eyebrow="🎯 Type"
            title="Transaction flow"
          >
            <View className="flex-row gap-3">
              {TYPE_OPTIONS.map((option) => (
                <TypePill
                  key={option.value}
                  onPress={() => handleTypeChange(option.value)}
                  option={option}
                  selected={type === option.value}
                />
              ))}
            </View>
          </SectionCard>

          <SectionCard
            description="Pick the account that should own this transaction."
            eyebrow="🏦 Source"
            title="From account"
          >
            <AccountPicker onChange={handleAccountChange} value={accountId} />
          </SectionCard>

          {type === "transfer" ? (
            <Animated.View
              entering={FadeInDown.duration(220)}
              exiting={FadeOutDown.duration(180)}
              layout={FORM_LAYOUT}
            >
              <SectionCard
                description="Transfers need a second account so balances stay accurate."
                eyebrow="🔁 Route"
                title="Destination"
              >
                <AccountPicker
                  exclude={accountId ? [accountId] : []}
                  onChange={handleToAccountChange}
                  value={toAccountId}
                />
              </SectionCard>
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeInDown.duration(220)}
              exiting={FadeOutDown.duration(180)}
              layout={FORM_LAYOUT}
            >
              <SectionCard
                description="Categories make the dashboard totals useful later."
                eyebrow="🧩 Context"
                title="Category"
              >
                <CategoryPicker onChange={setCategoryId} type={type} value={categoryId} />
              </SectionCard>
            </Animated.View>
          )}

          <SectionCard
            description="Shift the date without opening another keyboard."
            eyebrow="📅 Timing"
            title="Transaction date"
          >
            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <Pressable
                  accessibilityRole="button"
                  className="h-14 w-14 items-center justify-center rounded-full bg-gray-100 active:opacity-80"
                  onPress={() => setDate((currentDate) => shiftDate(currentDate, -1))}
                >
                  <ArrowLeftIcon color="#111827" size={22} weight="regular" />
                </Pressable>

                <View className="flex-1 rounded-[24px] border border-gray-200 bg-gray-50 px-4 py-3">
                  <Text className="text-xs font-semibold uppercase tracking-[1.4px] text-gray-400">
                    {getDisplayDateLabel(date)}
                  </Text>
                  <Text className="mt-1 text-[22px] font-bold text-gray-950">{date}</Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  className="h-14 w-14 items-center justify-center rounded-full bg-gray-100 active:opacity-80"
                  onPress={() => setDate((currentDate) => shiftDate(currentDate, 1))}
                >
                  <ArrowRightIcon color="#111827" size={22} weight="regular" />
                </Pressable>
              </View>

              <View className="flex-row gap-2">
                {DATE_SHORTCUTS.map((shortcut) => {
                  const resolvedDate = shortcut.resolve();

                  return (
                    <DateShortcut
                      emoji={shortcut.emoji}
                      key={shortcut.label}
                      label={shortcut.label}
                      onPress={() => setDate(resolvedDate)}
                      selected={date === resolvedDate}
                    />
                  );
                })}
              </View>
            </View>
          </SectionCard>

          <SectionCard
            description="Optional, but useful if this purchase needs a little story."
            eyebrow="📝 Note"
            title="Description"
          >
            <View className="gap-2">
              <TextInput
                className="min-h-[104px] rounded-[24px] border border-gray-200 bg-gray-50 px-4 py-4 text-base text-gray-950"
                maxLength={80}
                multiline
                numberOfLines={4}
                onChangeText={setDescription}
                placeholder="Coffee after the client meeting ☕"
                placeholderTextColor="#94A3B8"
                textAlignVertical="top"
                value={description}
              />

              <View className="flex-row items-center justify-between">
                <Text className="text-xs leading-5 text-gray-400">
                  {description.trim()
                    ? "Short notes stay readable in your timeline."
                    : "Skip it if the amount already says enough."}
                </Text>
                <Text className="text-xs font-semibold tabular-nums text-gray-500">
                  {description.length}/80
                </Text>
              </View>
            </View>
          </SectionCard>

          {showValidation && validationMessage ? (
            <Animated.View
              entering={FadeInDown.duration(180)}
              exiting={FadeOutDown.duration(160)}
              layout={FORM_LAYOUT}
            >
              <View className="flex-row items-start gap-3 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3">
                <WarningCircleIcon color="#B45309" size={22} weight="fill" />
                <View className="flex-1 gap-1">
                  <Text className="text-sm font-semibold text-amber-900">Needs attention</Text>
                  <Text className="text-sm leading-6 text-amber-800">{validationMessage}</Text>
                </View>
              </View>
            </Animated.View>
          ) : null}

          {showValidation && !validationMessage ? (
            <Animated.View
              entering={FadeInDown.duration(180)}
              exiting={FadeOutDown.duration(160)}
              layout={FORM_LAYOUT}
            >
              <View className="flex-row items-start gap-3 rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircleIcon color="#047857" size={22} weight="fill" />
                <View className="flex-1 gap-1">
                  <Text className="text-sm font-semibold text-emerald-900">Ready to save</Text>
                  <Text className="text-sm leading-6 text-emerald-800">
                    Everything checks out. Save whenever you are ready.
                  </Text>
                </View>
              </View>
            </Animated.View>
          ) : null}

          {submissionError ? (
            <Animated.View
              entering={FadeInDown.duration(180)}
              exiting={FadeOutDown.duration(160)}
              layout={FORM_LAYOUT}
            >
              <View className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3">
                <Text className="text-sm font-semibold text-red-800">{submissionError}</Text>
              </View>
            </Animated.View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            className="items-center rounded-[26px] px-4 py-4 active:opacity-85"
            disabled={saving}
            onPress={handleSubmit}
            style={{ backgroundColor: selectedType.color, opacity: saving ? 0.65 : 1 }}
          >
            <Text className="text-base font-bold text-white">
              {saving ? "Saving..." : submitLabel}
            </Text>
          </Pressable>

          {onDelete ? (
            <Pressable
              accessibilityRole="button"
              className="items-center rounded-[22px] border border-red-200 bg-white px-4 py-4 active:opacity-80"
              onPress={onDelete}
            >
              <Text className="text-sm font-semibold text-red-600">Delete transaction</Text>
            </Pressable>
          ) : null}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
