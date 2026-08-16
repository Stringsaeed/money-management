import { KeyboardAvoidingView, Platform, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { useForm } from "@tanstack/react-form";
import { batch } from "@tanstack/react-store";

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
import { NoteInput } from "./note-input";
import { EndsControl } from "./recurrence/ends-control";
import { RepeatControl } from "./recurrence/repeat-control";
import TransactionDatePicker from "./transaction-date-picker/transaction-date-picker";
import type { FormValues, TransactionFormProps } from "./types";
import { getCurrencySymbol, getDateDisplayValue, triggerErrorHaptic } from "./utils";
import { formatRecurrence } from "@/utils/recurring";

function formatEndsLabel(endDate: Date | null, endCount: number | null): string {
  if (endCount !== null) return `${endCount}×`;
  if (endDate !== null) return `Until ${getDateDisplayValue(endDate)}`;
  return "No end";
}

export type { TransactionFormData } from "./types";

export function TransactionForm({
  initialData,
  isRecurring,
  onSubmit,
  formRef,
  statusContent,
}: TransactionFormProps) {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  const firstAccountId = accounts[0]?.id ?? "";
  const firstAccountCurrency = accounts[0]?.currency ?? "USD";

  const numPad = useNumPadNumber((initialData?.amount ?? 0) / 100);

  const form = useForm({
    defaultValues: {
      accountId: initialData?.accountId ?? firstAccountId,
      toAccountId: initialData?.toAccountId ?? null,
      categoryId: initialData?.categoryId ?? null,
      description: initialData?.description ?? "",
      date: initialData?.date ?? new Date(),
      frequency: initialData?.recurrence?.frequency ?? "month",
      intervalCount: initialData?.recurrence?.intervalCount ?? 1,
      endDate: initialData?.recurrence?.endDate ?? null,
      endCount: initialData?.recurrence?.endCount ?? null,
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
      if (isRecurring && value.endDate && value.endDate < value.date) {
        triggerErrorHaptic();
        throw new Error("End date can't be before the start date.");
      }

      await onSubmit({
        type,
        amount: amountCents,
        accountId: value.accountId,
        toAccountId: type === "transfer" ? value.toAccountId : null,
        categoryId: type === "transfer" ? null : value.categoryId,
        isRecurring,
        description: value.description.trim(),
        date: value.date,
        currency,
        originalAmount: null,
        originalCurrency: null,
        exchangeRate: null,
        recurrence: {
          frequency: value.frequency,
          intervalCount: value.intervalCount,
          endDate: value.endDate,
          endCount: value.endCount,
        },
      });
    },
  });

  // Expose submit to parent via ref for native header integration
  if (formRef) {
    formRef.current = { submit: () => form.handleSubmit() };
  }

  return (
    <View className="flex-1 bg-surface pt-safe-offset-20">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {statusContent}
        {/* Breadcrumb: Account › Category › Date */}
        <View className="pt-2 pb-3">
          <Animated.ScrollView
            layout={LinearTransition.springify(400)}
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
                  <BreadcrumbSegment
                    emoji={isRecurring ? "▶️" : "📅"}
                    label={getDateDisplayValue(date)}
                    active
                  />
                </TransactionDatePicker>
              )}
            </form.Subscribe>

            {isRecurring ? (
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}
                layout={LinearTransition.springify(400)}
                style={{ flexDirection: "row", alignItems: "center", columnGap: 8 }}
              >
                <Text className="font-heading-normal text-sm italic text-ink/25">›</Text>
                <form.Subscribe selector={(s) => s.values.frequency}>
                  {(frequency) => (
                    <form.Subscribe selector={(s) => s.values.intervalCount}>
                      {(intervalCount) => (
                        <RepeatControl
                          frequency={frequency}
                          intervalCount={intervalCount}
                          onChange={(nextFrequency, nextCount) =>
                            batch(() => {
                              form.setFieldValue("frequency", nextFrequency);
                              form.setFieldValue("intervalCount", nextCount);
                            })
                          }
                        >
                          <BreadcrumbSegment
                            emoji="🔁"
                            label={formatRecurrence({ frequency, intervalCount })}
                            active
                          />
                        </RepeatControl>
                      )}
                    </form.Subscribe>
                  )}
                </form.Subscribe>

                <Text className="font-heading-normal text-sm italic text-ink/25">›</Text>

                <form.Subscribe selector={(s) => s.values.date}>
                  {(date) => (
                    <form.Subscribe selector={(s) => s.values.endDate}>
                      {(endDate) => (
                        <form.Subscribe selector={(s) => s.values.endCount}>
                          {(endCount) => (
                            <EndsControl
                              startDate={date}
                              endDate={endDate}
                              endCount={endCount}
                              onChange={(patch) =>
                                batch(() => {
                                  form.setFieldValue("endDate", patch.endDate);
                                  form.setFieldValue("endCount", patch.endCount);
                                })
                              }
                            >
                              <BreadcrumbSegment
                                emoji="🏁"
                                label={formatEndsLabel(endDate, endCount)}
                                active={endDate !== null || endCount !== null}
                              />
                            </EndsControl>
                          )}
                        </form.Subscribe>
                      )}
                    </form.Subscribe>
                  )}
                </form.Subscribe>
              </Animated.View>
            ) : null}
          </Animated.ScrollView>
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
                <AmountDisplay currencySymbol={symbol} numPadConfig={numPad} />
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
