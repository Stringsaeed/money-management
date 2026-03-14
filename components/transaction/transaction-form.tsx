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
import { toDateString, today } from "@/utils/date";
import type { TransactionType } from "@/types";
import {
  getCurrencySymbol,
  getDisplayDateLabel,
  getValidationMessage,
  shiftDate,
  triggerErrorHaptic,
} from "./utils";
import TransactionDatePicker from "./transaction-date-picker/transaction-date-picker";
import { parseISO } from "date-fns";
import { cn } from "heroui-native";

export interface TransactionFormData {
  type: TransactionType;
  amount: number;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  description: string;
  date: Date;
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
] as const;

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
  const [date, setDate] = useState(initialData?.date ?? new Date());
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
      className="flex-1 pb-safe pt-safe"
    >
      <View className="flex-1 px-4 pb-4">
        <View className="flex-row items-center justify-between">
          <CloseButton
            className="bg-white/8"
            iconProps={{ size: 18 }}
            onPress={() => router.back()}
          />

          <View className="flex-row items-center gap-2">
            <TransactionDatePicker date={date} onChange={setDate} />
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

        <View className="flex-1">
          <View className={twMerge("flex-1 items-center justify-center", tight ? "pt-1" : "pt-3")}>
            <AnimatedPrice currency="AED" size={tight ? 68 : 78}>
              {numPad.displayValue}
            </AnimatedPrice>
          </View>

          <View className={cn("w-full flex-1", tight ? "mt-2" : "mt-3")}>
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
