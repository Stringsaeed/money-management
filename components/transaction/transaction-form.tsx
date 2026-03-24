import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useForm } from "@tanstack/react-form";

import NumberPad from "@/components/transaction/num-pad";
import { Text } from "@/components/ui/text";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import useNumPadNumber from "@/hooks/use-num-pad-number";
import type { TransactionType } from "@/types";

import AccountPicker from "./account-picker/account-picker";
import { AmountDisplay } from "./amount-display";
import { BreadcrumbSegment } from "./breadcrumb-segment";
import CategoryPicker from "./category-picker/category-picker";
import { layoutTransition } from "./constants";
import { FormHeader } from "./form-header";
import { NoteInput } from "./note-input";
import TransactionDatePicker from "./transaction-date-picker/transaction-date-picker";
import type { FormValues, TransactionFormProps } from "./types";
import { getCurrencySymbol, getDateDisplayValue, triggerErrorHaptic } from "./utils";

export type { TransactionFormData } from "./types";

export function TransactionForm({ initialData, onSubmit, onDelete }: TransactionFormProps) {
  const router = useRouter();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

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
        router.replace("/");
      }
    } catch (e) {
      console.error("Navigation error:", e);
    }
  };

  return (
    <View className="flex-1 bg-surface">
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
                      <AccountPicker
                        accounts={accounts}
                        selectedId={accountId}
                        onChange={(id) => form.setFieldValue("accountId", id)}
                      >
                        <BreadcrumbSegment
                          emoji="🏦"
                          label={account?.name ?? "Account"}
                          active={!!account}
                        />
                      </AccountPicker>
                      <Text className="font-heading-normal text-sm italic text-ink/25">›</Text>
                    </>
                  );
                }}
              </form.Subscribe>
            ) : null}

            <form.Subscribe selector={(s) => s.values.categoryId}>
              {(categoryId) => {
                const category = categories.find((c) => c.id === categoryId);
                return (
                  <CategoryPicker
                    categories={categories}
                    selectedId={categoryId}
                    onChange={(id) => form.setFieldValue("categoryId", id)}
                  >
                    <BreadcrumbSegment
                      emoji={category?.icon ?? "🏷️"}
                      label={category?.name ?? "Category"}
                      active={!!category}
                    />
                  </CategoryPicker>
                );
              }}
            </form.Subscribe>

            <Text className="font-heading-normal text-sm italic text-ink/25">›</Text>

            <form.Subscribe selector={(s) => s.values.date}>
              {(date) => (
                <TransactionDatePicker date={date} onChange={(d) => form.setFieldValue("date", d)}>
                  <BreadcrumbSegment emoji="📅" label={getDateDisplayValue(date)} active />
                </TransactionDatePicker>
              )}
            </form.Subscribe>
          </ScrollView>
        </View>

        {/* Amount */}
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

        {/* Note */}
        <form.Subscribe selector={(s) => s.values.description}>
          {(description) => (
            <NoteInput
              value={description}
              onChange={(text) => form.setFieldValue("description", text)}
            />
          )}
        </form.Subscribe>
      </KeyboardAvoidingView>

      {/* Number pad */}
      <View className="flex-1 px-4 border-t border-ledger-outline">
        <NumberPad
          onClear={numPad.clearAll}
          onDelete={numPad.deleteDigit}
          onDot={numPad.addDecimalPoint}
          onPress={numPad.appendDigit}
        />
      </View>
    </View>
  );
}
