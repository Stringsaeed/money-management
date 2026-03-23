import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { ArrowLeftIcon, CheckIcon, TrashIcon } from "phosphor-react-native";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { AnimatedRollingNumber } from "react-native-animated-rolling-numbers";

import NumberPad from "@/components/transaction/num-pad";
import { Text } from "@/components/ui/text";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import useNumPadNumber from "@/hooks/use-num-pad-number";
import type { TransactionType } from "@/types";
import { getCurrencySymbol, getValidationMessage, triggerErrorHaptic } from "./utils";
import TransactionDatePicker from "./transaction-date-picker/transaction-date-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

const INK = "#1C1B1A";
const DESTRUCTIVE = "#D9534F";

const layoutTransition = LinearTransition.springify().damping(20).stiffness(150);

const SHEET_BG = { backgroundColor: "#F9F8F6" };
const SHEET_HANDLE = { backgroundColor: "#EBE8E3" };

// ─── Header ───────────────────────────────────────────────────────────────────

function FormHeader({
  onBack,
  onDelete,
  onSubmit,
  saving,
  title,
}: {
  onBack: () => void;
  onDelete?: () => void;
  onSubmit: () => void;
  saving: boolean;
  title: string;
}) {
  return (
    <View className="flex-row items-center justify-between px-5 pt-safe pb-3">
      <Pressable
        onPress={onBack}
        className="h-10 w-10 items-center justify-center rounded-full bg-surface-container active:bg-surface-dim"
      >
        <ArrowLeftIcon size={20} color={INK} weight="bold" />
      </Pressable>

      <Text className="font-heading-normal text-[18px] italic text-ink">{title}</Text>

      <View className="flex-row items-center gap-2">
        {onDelete ? (
          <Pressable
            onPress={onDelete}
            className="h-10 w-10 items-center justify-center rounded-full bg-terracotta/10 active:bg-terracotta/20"
          >
            <TrashIcon size={18} color={DESTRUCTIVE} weight="bold" />
          </Pressable>
        ) : null}
        <Pressable
          onPress={onSubmit}
          disabled={saving}
          className="h-10 w-10 items-center justify-center rounded-full bg-ink active:opacity-80"
          style={{ opacity: saving ? 0.5 : 1 }}
        >
          <CheckIcon size={20} color="#F9F8F6" weight="bold" />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Breadcrumb Segment ───────────────────────────────────────────────────────

function BreadcrumbSegment({
  emoji,
  label,
  active,
  onPress,
}: {
  emoji: string;
  label: string;
  active?: boolean;
  onPress?: VoidFunction;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container active:bg-surface-dim"
    >
      <Text className="text-[14px]">{emoji}</Text>
      <Text
        className={`font-body-medium text-[13px] ${active ? "text-ink" : "text-ink/35"}`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Amount Display ───────────────────────────────────────────────────────────

function AmountDisplay({ currencySymbol, value }: { currencySymbol: string; value: number }) {
  return (
    <View className="flex-row items-baseline">
      <Text
        className="font-heading-medium text-[18px] text-ink/30 mr-1"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {currencySymbol}
      </Text>
      <AnimatedRollingNumber
        useGrouping
        value={value}
        textStyle={{
          fontFamily: "Newsreader_500Medium",
          fontSize: 52,
          color: INK,
          lineHeight: 60,
        }}
      />
    </View>
  );
}

// ─── Category Bottom Sheet ────────────────────────────────────────────────────

function CategorySheet({
  sheetRef,
  categories,
  selectedId,
  onSelect,
}: {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  categories: { id: string; name: string; icon: string; color: string; type: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const renderGrid = (items: typeof categories) => (
    <View className="flex-row flex-wrap gap-2">
      {items.map((cat) => {
        const isSelected = cat.id === selectedId;
        return (
          <Pressable
            key={cat.id}
            onPress={() => {
              onSelect(cat.id);
              sheetRef.current?.dismiss();
            }}
            className="items-center gap-1.5 px-4 py-3 rounded-xl"
            style={{ backgroundColor: isSelected ? `${cat.color}20` : "#F1F0EE" }}
          >
            <Text className="text-[24px]">{cat.icon}</Text>
            <Text
              className="font-body-medium text-[12px]"
              style={{ color: isSelected ? INK : "#1C1B1A66" }}
            >
              {cat.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <BottomSheetModal
      enableDynamicSizing
      ref={sheetRef}
      backgroundStyle={SHEET_BG}
      topInset={insets.top}
      handleIndicatorStyle={SHEET_HANDLE}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
      )}
    >
      <BottomSheetView className="pb-safe px-5 gap-5">
        <Text className="font-heading-normal text-[20px] italic text-ink">Category</Text>

        {expenseCategories.length > 0 ? (
          <View className="gap-3">
            <Text className="font-body-semibold text-[10px] text-ink/40 uppercase tracking-[1.5px]">
              Expenses
            </Text>
            {renderGrid(expenseCategories)}
          </View>
        ) : null}

        {incomeCategories.length > 0 ? (
          <View className="gap-3">
            <Text className="font-body-semibold text-[10px] text-ink/40 uppercase tracking-[1.5px]">
              Income
            </Text>
            {renderGrid(incomeCategories)}
          </View>
        ) : null}

        <View className="h-4" />
      </BottomSheetView>
    </BottomSheetModal>
  );
}

// ─── Account Bottom Sheet ─────────────────────────────────────────────────────

function AccountSheet({
  sheetRef,
  accounts,
  selectedId,
  onSelect,
}: {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  accounts: { id: string; name: string; currency: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <BottomSheetModal
      enableDynamicSizing
      ref={sheetRef}
      backgroundStyle={SHEET_BG}
      topInset={insets.top}
      handleIndicatorStyle={SHEET_HANDLE}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
      )}
    >
      <BottomSheetView className="pb-safe px-5 gap-4">
        <Text className="font-heading-normal text-[20px] italic text-ink">Account</Text>

        <View className="gap-2">
          {accounts.map((acc) => {
            const isSelected = acc.id === selectedId;
            return (
              <Pressable
                key={acc.id}
                onPress={() => {
                  onSelect(acc.id);
                  sheetRef.current?.dismiss();
                }}
                className={`flex-row items-center gap-3 px-4 py-3.5 rounded-xl ${
                  isSelected ? "bg-ink" : "bg-surface-container"
                }`}
              >
                <Text className="text-[18px]">🏦</Text>
                <View className="flex-1">
                  <Text
                    className={`font-body-medium text-[15px] ${isSelected ? "text-surface" : "text-ink"}`}
                  >
                    {acc.name}
                  </Text>
                  <Text
                    className={`font-body-normal text-[12px] ${isSelected ? "text-surface/60" : "text-ink/40"}`}
                  >
                    {acc.currency}
                  </Text>
                </View>
                {isSelected ? <CheckIcon size={18} color="#F9F8F6" weight="bold" /> : null}
              </Pressable>
            );
          })}
        </View>

        <View className="h-4" />
      </BottomSheetView>
    </BottomSheetModal>
  );
}

// ─── Note Input ───────────────────────────────────────────────────────────────

function NoteInput({ value, onChange }: { value: string; onChange: (text: string) => void }) {
  return (
    <View className="px-5 py-2">
      <View className="flex-row items-center gap-2 bg-surface-container rounded-xl px-4 py-2.5">
        <Text className="text-[16px]">📝</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Add a note..."
          placeholderTextColor="#1C1B1A40"
          className="flex-1 font-body-normal text-[15px] text-ink py-0"
        />
      </View>
    </View>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export function TransactionForm({ initialData, onSubmit, onDelete }: TransactionFormProps) {
  const router = useRouter();
  const { data: accounts = [] } = useAccounts();

  const categorySheetRef = useRef<BottomSheetModal>(null);
  const accountSheetRef = useRef<BottomSheetModal>(null);

  const firstAccountId = accounts[0]?.id ?? "";
  const firstAccountCurrency = accounts[0]?.currency ?? "USD";

  const [accountId, setAccountId] = useState(initialData?.accountId ?? "");
  const [toAccountId] = useState<string | null>(initialData?.toAccountId ?? null);
  const [categoryId, setCategoryId] = useState<string | null>(initialData?.categoryId ?? null);
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [date, setDate] = useState(initialData?.date ?? new Date());
  const [saving, setSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  const { data: categories = [] } = useCategories();

  const numPad = useNumPadNumber((initialData?.amount ?? 0) / 100);
  const amountCents = Math.round(numPad.value * 100);

  const currentAccount = accounts.find((account) => account.id === accountId);
  const currentCategory = categories.find((category) => category.id === categoryId);
  const type: TransactionType = currentCategory?.type ?? initialData?.type ?? "expense";
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

  const isEditing = !!initialData?.amount;

  useEffect(() => {
    if (!accountId && firstAccountId) {
      setAccountId(firstAccountId);
    }
  }, [accountId, firstAccountId]);

  useEffect(() => {
    setSubmissionError("");
  }, [type, amountCents, accountId, toAccountId, categoryId, description, date]);

  const handleBack = () => {
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

  const getDateDisplayValue = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <View className="flex-1 bg-surface">
      {/* Upper half: header + breadcrumb + amount + note */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <FormHeader
          onBack={handleBack}
          onDelete={onDelete}
          onSubmit={handleSubmit}
          saving={saving}
          title={isEditing ? "Edit Entry" : "New Entry"}
        />

        {/* Breadcrumb: Account › Category › Date */}
        <View className="pt-2 pb-3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: "center" }}
          >
            {accounts.length > 1 ? (
              <>
                <BreadcrumbSegment
                  emoji="🏦"
                  label={currentAccount?.name ?? "Account"}
                  active={!!currentAccount}
                  onPress={() => accountSheetRef.current?.present()}
                />
                <Text className="font-heading-normal text-[14px] italic text-ink/25">›</Text>
              </>
            ) : null}

            <BreadcrumbSegment
              emoji={currentCategory?.icon ?? "🏷️"}
              label={currentCategory?.name ?? "Category"}
              active={!!currentCategory}
              onPress={() => categorySheetRef.current?.present()}
            />

            <Text className="font-heading-normal text-[14px] italic text-ink/25">›</Text>

            <TransactionDatePicker date={date} onChange={setDate}>
              <BreadcrumbSegment emoji="📅" label={getDateDisplayValue()} active />
            </TransactionDatePicker>
          </ScrollView>
        </View>

        {/* Amount — centered in remaining space */}
        <Animated.View
          layout={layoutTransition}
          className="flex-1 items-center justify-center px-5"
        >
          <AmountDisplay currencySymbol={currencySymbol} value={numPad.value} />
        </Animated.View>

        {/* Validation / error messages */}
        {showValidation && validationMessage ? (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            layout={layoutTransition}
            className="px-5 pb-2"
          >
            <Text className="font-body-medium text-[13px] text-destructive text-center">
              {validationMessage}
            </Text>
          </Animated.View>
        ) : null}

        {submissionError ? (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            layout={layoutTransition}
            className="px-5 pb-2"
          >
            <Text className="font-body-medium text-[13px] text-destructive text-center">
              {submissionError}
            </Text>
          </Animated.View>
        ) : null}

        {/* Note input */}
        <NoteInput value={description} onChange={setDescription} />
      </KeyboardAvoidingView>

      {/* Lower half: compact number pad */}
      <View className="flex-1 px-4 border-t border-ledger-outline">
        <NumberPad
          onClear={numPad.clearAll}
          onDelete={numPad.deleteDigit}
          onDot={numPad.addDecimalPoint}
          onPress={numPad.appendDigit}
        />
      </View>

      {/* Bottom sheets */}
      <CategorySheet
        sheetRef={categorySheetRef}
        categories={categories}
        selectedId={categoryId}
        onSelect={setCategoryId}
      />
      <AccountSheet
        sheetRef={accountSheetRef}
        accounts={accounts}
        selectedId={accountId}
        onSelect={setAccountId}
      />
    </View>
  );
}
