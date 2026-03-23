import { useRouter } from "expo-router";
import React, { useRef } from "react";
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
import { useForm } from "@tanstack/react-form";

import NumberPad from "@/components/transaction/num-pad";
import { Text } from "@/components/ui/text";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import useNumPadNumber from "@/hooks/use-num-pad-number";
import type { TransactionType } from "@/types";
import { getCurrencySymbol, triggerErrorHaptic } from "./utils";
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

interface FormValues {
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  description: string;
  date: Date;
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

// ─── Date Display Helper ──────────────────────────────────────────────────────

function getDateDisplayValue(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export function TransactionForm({ initialData, onSubmit, onDelete }: TransactionFormProps) {
  const router = useRouter();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  const categorySheetRef = useRef<BottomSheetModal>(null);
  const accountSheetRef = useRef<BottomSheetModal>(null);

  const firstAccountId = accounts[0]?.id ?? "";
  const firstAccountCurrency = accounts[0]?.currency ?? "USD";

  const numPad = useNumPadNumber((initialData?.amount ?? 0) / 100);
  const isEditing = !!initialData?.amount;

  const form = useForm({
    defaultValues: {
      accountId: initialData?.accountId ?? firstAccountId,
      toAccountId: initialData?.toAccountId ?? null,
      categoryId: initialData?.categoryId ?? null,
      description: initialData?.description ?? "",
      date: initialData?.date ?? new Date(),
    } as FormValues,
    onSubmit: async ({ value }) => {
      const amountCents = Math.round(numPad.value * 100);
      const currentCategory = categories.find((c) => c.id === value.categoryId);
      const type: TransactionType = currentCategory?.type ?? initialData?.type ?? "expense";
      const currentAccount = accounts.find((a) => a.id === value.accountId);
      const currency = currentAccount?.currency ?? initialData?.currency ?? firstAccountCurrency;

      if (amountCents <= 0) {
        triggerErrorHaptic();
        throw new Error("Enter an amount above 0.00.");
      }
      if (!value.accountId) {
        triggerErrorHaptic();
        throw new Error("Pick the source account.");
      }

      await onSubmit({
        type,
        amount: amountCents,
        accountId: value.accountId,
        toAccountId: type === "transfer" ? value.toAccountId : null,
        categoryId: type === "transfer" ? null : value.categoryId,
        description: value.description.trim(),
        date: value.date,
        currency,
        originalAmount: null,
        originalCurrency: null,
        exchangeRate: null,
      });
    },
  });

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

  return (
    <View className="flex-1 bg-surface">
      {/* Upper half: header + breadcrumb + amount + note */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <FormHeader
              onBack={handleBack}
              onDelete={onDelete}
              onSubmit={() => form.handleSubmit()}
              saving={isSubmitting}
              title={isEditing ? "Edit Entry" : "New Entry"}
            />
          )}
        </form.Subscribe>

        {/* Breadcrumb: Account › Category › Date */}
        <View className="pt-2 pb-3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: "center" }}
          >
            {accounts.length > 1 ? (
              <form.Subscribe selector={(s) => s.values.accountId}>
                {(accountId) => {
                  const account = accounts.find((a) => a.id === accountId);
                  return (
                    <>
                      <BreadcrumbSegment
                        emoji="🏦"
                        label={account?.name ?? "Account"}
                        active={!!account}
                        onPress={() => accountSheetRef.current?.present()}
                      />
                      <Text className="font-heading-normal text-[14px] italic text-ink/25">›</Text>
                    </>
                  );
                }}
              </form.Subscribe>
            ) : null}

            <form.Subscribe selector={(s) => s.values.categoryId}>
              {(categoryId) => {
                const category = categories.find((c) => c.id === categoryId);
                return (
                  <BreadcrumbSegment
                    emoji={category?.icon ?? "🏷️"}
                    label={category?.name ?? "Category"}
                    active={!!category}
                    onPress={() => categorySheetRef.current?.present()}
                  />
                );
              }}
            </form.Subscribe>

            <Text className="font-heading-normal text-[14px] italic text-ink/25">›</Text>

            <form.Subscribe selector={(s) => s.values.date}>
              {(date) => (
                <TransactionDatePicker date={date} onChange={(d) => form.setFieldValue("date", d)}>
                  <BreadcrumbSegment emoji="📅" label={getDateDisplayValue(date)} active />
                </TransactionDatePicker>
              )}
            </form.Subscribe>
          </ScrollView>
        </View>

        {/* Amount — centered in remaining space */}
        <form.Subscribe selector={(s) => s.values.accountId}>
          {(accountId) => {
            const account = accounts.find((a) => a.id === accountId);
            const currency = account?.currency ?? initialData?.currency ?? firstAccountCurrency;
            const symbol = getCurrencySymbol(currency);
            return (
              <Animated.View
                layout={layoutTransition}
                className="flex-1 items-center justify-center px-5"
              >
                <AmountDisplay currencySymbol={symbol} value={numPad.value} />
              </Animated.View>
            );
          }}
        </form.Subscribe>

        {/* Submission error */}
        <form.Subscribe selector={(s) => (s.submissionAttempts > 0 ? s.errors : [])}>
          {(errors) =>
            errors.length > 0 ? (
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}
                layout={layoutTransition}
                className="px-5 pb-2"
              >
                <Text className="font-body-medium text-[13px] text-destructive text-center">
                  {errors.join(", ")}
                </Text>
              </Animated.View>
            ) : null
          }
        </form.Subscribe>

        {/* Note input */}
        <form.Subscribe selector={(s) => s.values.description}>
          {(description) => (
            <NoteInput
              value={description}
              onChange={(text) => form.setFieldValue("description", text)}
            />
          )}
        </form.Subscribe>
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
      <form.Subscribe
        selector={(s) => ({ categoryId: s.values.categoryId, accountId: s.values.accountId })}
      >
        {({ categoryId, accountId }) => (
          <>
            <CategorySheet
              sheetRef={categorySheetRef}
              categories={categories}
              selectedId={categoryId}
              onSelect={(id) => form.setFieldValue("categoryId", id)}
            />
            <AccountSheet
              sheetRef={accountSheetRef}
              accounts={accounts}
              selectedId={accountId}
              onSelect={(id) => form.setFieldValue("accountId", id)}
            />
          </>
        )}
      </form.Subscribe>
    </View>
  );
}
