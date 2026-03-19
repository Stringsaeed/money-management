import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, View, useWindowDimensions } from "react-native";
import {
  ArrowLeftIcon,
  CalendarBlankIcon,
  CaretDownIcon,
  CheckIcon,
  NoteBlankIcon,
  TagIcon,
  TrashIcon,
} from "phosphor-react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { formatRelative } from "date-fns";
import { AnimatedRollingNumber } from "react-native-animated-rolling-numbers";

import NumberPad from "@/components/transaction/num-pad";
import { Text } from "@/components/ui/text";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import useNumPadNumber from "@/hooks/use-num-pad-number";
import type { TransactionType } from "@/types";
import { getCurrencySymbol, getValidationMessage, triggerErrorHaptic } from "./utils";
import TransactionDatePicker from "./transaction-date-picker/transaction-date-picker";

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

const MUTED = "#9CA3AF";
const ACCENT = "#11181C";
const BG = "#FFFFFF";
const CATEGORY_HIGHLIGHT = "#F3F4F6";

const layoutTransition = LinearTransition.springify().damping(20).stiffness(150);

export function TransactionForm({ initialData, onSubmit, onDelete }: TransactionFormProps) {
  const router = useRouter();
  const { data: accounts = [] } = useAccounts();
  const { height } = useWindowDimensions();

  const firstAccountId = accounts[0]?.id ?? "";
  const firstAccountCurrency = accounts[0]?.currency ?? "USD";

  const [type, setType] = useState<TransactionType>(initialData?.type ?? "expense");
  const [accountId, setAccountId] = useState(initialData?.accountId ?? "");
  const [toAccountId] = useState<string | null>(initialData?.toAccountId ?? null);
  const [categoryId, setCategoryId] = useState<string | null>(initialData?.categoryId ?? null);
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [date, setDate] = useState(initialData?.date ?? new Date());
  const [saving, setSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showNotePad, setShowNotePad] = useState(false);
  const { data: categories = [] } = useCategories(type === "income" ? "income" : "expense");

  const numPad = useNumPadNumber((initialData?.amount ?? 0) / 100);
  const amountCents = Math.round(numPad.value * 100);

  const currentAccount = accounts.find((account) => account.id === accountId);
  const currentCategory = categories.find((category) => category.id === categoryId);
  const currency = currentAccount?.currency ?? initialData?.currency ?? firstAccountCurrency;
  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency]);
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

  const handleTypeToggle = () => {
    const next = type === "expense" ? "income" : "expense";
    setType(next);
    setCategoryId(null);
    if (process.env.EXPO_OS === "ios") {
      Haptics.selectionAsync();
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

  const isExpense = type === "expense";
  const verbText = isExpense ? "You spent" : "You received";
  const prepositionText = isExpense ? "on" : "from";
  const dateLabel = formatRelative(date, new Date());

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      style={{ backgroundColor: BG }}
    >
      {/* Header bar */}
      <View className="flex-row items-center justify-between px-5 pt-safe pb-2">
        <Pressable
          onPress={() => {
            try {
              if (router.canDismiss()) {
                router.dismiss();
              } else if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(tabs)");
              }
            } catch (e) {
              console.error("Navigation error:", e);
            }
          }}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: "#F3F4F6" }}
        >
          <ArrowLeftIcon size={20} color={ACCENT} weight="bold" />
        </Pressable>

        <View className="flex-row items-center gap-3">
          {onDelete ? (
            <Pressable
              onPress={onDelete}
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: "#FEE2E2" }}
            >
              <TrashIcon size={18} color="#DC2626" weight="bold" />
            </Pressable>
          ) : null}
          <Pressable
            onPress={handleSubmit}
            disabled={saving}
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: ACCENT, opacity: saving ? 0.5 : 1 }}
          >
            <CheckIcon size={20} color="#FFFFFF" weight="bold" />
          </Pressable>
        </View>
      </View>

      {/* Typography-driven form */}
      <View className={`flex-1 px-6 ${tight ? "pt-2" : "pt-6"}`}>
        <Animated.View
          layout={layoutTransition}
          className="gap-1 flex-1 items-center flex-row flex-wrap"
        >
          <Pressable onPress={handleTypeToggle}>
            <View className="flex-row items-center gap-2">
              <Text className="font-medium tracking-wide uppercase" style={{ color: MUTED }}>
                {verbText}
              </Text>
              <CaretDownIcon size={12} color={MUTED} weight="bold" />
            </View>
          </Pressable>

          <View
            className="flex-row items-center gap-1.5 rounded-xl px-3 py-1.5"
            style={{ backgroundColor: CATEGORY_HIGHLIGHT, borderCurve: "continuous" }}
          >
            <Text className="font-normal">{currencySymbol}</Text>
            <AnimatedRollingNumber useGrouping value={numPad.value} />
          </View>

          <View className="flex-row flex-wrap items-center gap-1.5 mt-1">
            <Text className="text-xl font-medium text-muted">{prepositionText}</Text>
            <Pressable
              onPress={() => {
                setShowCategoryPicker(!showCategoryPicker);
                setShowNotePad(false);
              }}
            >
              <View
                className="flex-row items-center gap-1.5 rounded-xl px-3 py-1.5"
                style={{
                  backgroundColor: currentCategory
                    ? `${currentCategory.color}15`
                    : CATEGORY_HIGHLIGHT,
                  borderCurve: "continuous",
                }}
              >
                {currentCategory ? (
                  <Text className="text-[18px]">{currentCategory.icon}</Text>
                ) : (
                  <TagIcon size={16} color={MUTED} weight="duotone" />
                )}
                <Text
                  className="text-[18px] font-semibold"
                  style={{ color: currentCategory ? currentCategory.color : MUTED }}
                >
                  {currentCategory?.name ?? "category"}
                </Text>
                <CaretDownIcon
                  size={12}
                  color={currentCategory ? currentCategory.color : MUTED}
                  weight="bold"
                />
              </View>
            </Pressable>
          </View>

          <View className="flex-row items-center gap-1.5 mt-1">
            <Text className="text-xl font-medium" style={{ color: MUTED }}>
              at
            </Text>
            <TransactionDatePicker date={date} onChange={setDate}></TransactionDatePicker>
          </View>

          <View className="flex-row items-center gap-1.5 mt-1">
            <Pressable
              onPress={() => {
                setShowNotePad(!showNotePad);
                setShowCategoryPicker(false);
              }}
            >
              <View
                className="flex-row items-center gap-1.5 rounded-xl px-3 py-1.5"
                style={{
                  backgroundColor: description ? "#F0FDF4" : CATEGORY_HIGHLIGHT,
                  borderCurve: "continuous",
                }}
              >
                <NoteBlankIcon size={16} color={description ? "#16A34A" : MUTED} weight="duotone" />
                <Text
                  className="text-[18px] font-semibold"
                  style={{ color: description ? ACCENT : MUTED }}
                >
                  {description || "add a note"}
                </Text>
              </View>
            </Pressable>
          </View>
        </Animated.View>

        {/* Validation message */}
        {showValidation && validationMessage ? (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            layout={layoutTransition}
            className="mt-3"
          >
            <Text className="text-sm font-medium" style={{ color: "#DC2626" }}>
              {validationMessage}
            </Text>
          </Animated.View>
        ) : null}

        {submissionError ? (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            layout={layoutTransition}
            className="mt-3"
          >
            <Text className="text-sm font-medium" style={{ color: "#DC2626" }}>
              {submissionError}
            </Text>
          </Animated.View>
        ) : null}

        {/* Number pad */}
        <View className="grow">
          <NumberPad
            onClear={numPad.clearAll}
            onDelete={numPad.deleteDigit}
            onDot={numPad.addDecimalPoint}
            onPress={numPad.appendDigit}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
