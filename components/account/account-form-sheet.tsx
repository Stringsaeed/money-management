import { useForm } from "@tanstack/react-form";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { ACCOUNT_TYPE_META } from "@/components/account/account-form-options";
import { AccountColorPicker } from "@/components/account/account-color-picker";
import { AccountCurrencyPicker } from "@/components/account/account-currency-picker";
import { AccountTypePicker } from "@/components/account/account-type-picker";
import { AccountTypeColors } from "@/constants/theme";
import { useCreateAccount } from "@/hooks/use-accounts";
import { cn } from "@/lib/utils";
import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import type { AccountType } from "@/types";
import { decimalStringToCents } from "@/utils/currency";

interface AccountFormValues {
  amount: string;
  color: string;
  currency: string;
  name: string;
  type: AccountType;
}

const AMOUNT_PATTERN = /^\d*(\.\d{0,2})?$/;

export function AccountFormSheet() {
  const createAccount = useCreateAccount();
  const [error, setError] = useState("");
  const [hasCustomColor, setHasCustomColor] = useState(false);

  const form = useForm({
    defaultValues: {
      amount: "",
      color: AccountTypeColors.checking,
      currency: "USD",
      name: "",
      type: "checking",
    } as AccountFormValues,
    onSubmit: async ({ value }) => {
      const trimmedName = value.name.trim();
      setError("");

      if (!trimmedName) {
        setError("Enter account name.");
        return;
      }

      if (value.amount.trim() && !AMOUNT_PATTERN.test(value.amount.trim())) {
        setError("Enter valid amount with up to 2 decimals.");
        return;
      }

      try {
        await createAccount.mutateAsync({
          color: value.color,
          currency: value.currency,
          excludeFromTotal: false,
          icon: ACCOUNT_TYPE_META[value.type].systemIcon,
          initialBalance: decimalStringToCents(value.amount),
          name: trimmedName,
          sortOrder: 0,
          type: value.type,
        });

        router.back();
      } catch {
        setError("Couldn't create account. Try again.");
      }
    },
  });

  function handleTypeChange(nextType: AccountType) {
    form.setFieldValue("type", nextType);

    if (!hasCustomColor) {
      form.setFieldValue("color", ACCOUNT_TYPE_META[nextType].color);
    }
  }

  function handleColorChange(nextColor: string) {
    setHasCustomColor(true);
    form.setFieldValue("color", nextColor);
  }

  return (
    <View className="gap-5 px-5 pb-safe-offset-8 pt-6">
      <View className="gap-2">
        <Text className="font-heading-normal text-3xl italic text-ink">Add account 💳</Text>
        <Text className="font-body-normal text-sm leading-6 text-ink/50">
          Simple account setup. Fill five fields. Save.
        </Text>
      </View>

      <View className="gap-4 rounded-3xl border border-ledger-outline bg-surface-container p-5">
        <form.Field name="name">
          {(field) => (
            <View className="gap-2">
              <Text className="font-body-medium text-sm text-ink/60">Name</Text>
              <TextInput
                autoFocus
                className="rounded-2xl border border-ledger-outline bg-surface px-4 py-3 text-base text-ink"
                onChangeText={field.handleChange}
                placeholder="e.g. Main Checking"
                placeholderTextColor="#9a9896"
                returnKeyType="next"
                value={field.state.value}
              />
            </View>
          )}
        </form.Field>

        <form.Field name="amount">
          {(field) => (
            <View className="gap-2">
              <Text className="font-body-medium text-sm text-ink/60">Amount</Text>
              <TextInput
                className="rounded-2xl border border-ledger-outline bg-surface px-4 py-3 text-base text-ink"
                keyboardType="decimal-pad"
                onChangeText={field.handleChange}
                placeholder="0.00"
                placeholderTextColor="#9a9896"
                returnKeyType="done"
                value={field.state.value}
              />
            </View>
          )}
        </form.Field>

        <form.Field name="currency">
          {(field) => (
            <View className="gap-2">
              <Text className="font-body-medium text-sm text-ink/60">Currency</Text>
              <AccountCurrencyPicker onChange={field.handleChange} value={field.state.value} />
            </View>
          )}
        </form.Field>

        <form.Field name="type">
          {(field) => (
            <View className="gap-2">
              <Text className="font-body-medium text-sm text-ink/60">Type</Text>
              <AccountTypePicker onChange={handleTypeChange} value={field.state.value} />
            </View>
          )}
        </form.Field>

        <form.Field name="color">
          {(field) => (
            <View className="gap-2">
              <Text className="font-body-medium text-sm text-ink/60">Color</Text>
              <AccountColorPicker onChange={handleColorChange} value={field.state.value} />
            </View>
          )}
        </form.Field>
      </View>

      {error ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          layout={layoutTransition}
        >
          <Text className="text-center font-body-medium text-sm text-destructive">{error}</Text>
        </Animated.View>
      ) : null}

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Pressable
            className={cn(
              "items-center rounded-2xl bg-ink px-4 py-4 active:bg-ink/90",
              isSubmitting && "opacity-60",
            )}
            disabled={isSubmitting}
            onPress={() => form.handleSubmit()}
          >
            <Text className="font-body-semibold text-base text-surface">
              {isSubmitting ? "Creating…" : "Create Account"}
            </Text>
          </Pressable>
        )}
      </form.Subscribe>
    </View>
  );
}
