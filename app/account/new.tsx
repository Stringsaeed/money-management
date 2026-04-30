import { router, Stack } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";

import { AccountCurrencyPicker } from "@/components/account/account-currency-picker";
import { ACCOUNT_TYPE_META } from "@/components/account/account-form-options";
import { AccountPreviewCard } from "@/components/account/account-preview-card";
import { AccountTypePicker } from "@/components/account/account-type-picker";
import { AmountInput } from "@/components/common/amount-input";
import { ColorPicker } from "@/components/common/color-picker";
import { AccountTypeColors } from "@/constants/theme";
import { useCreateAccount } from "@/hooks/use-accounts";
import { cn } from "@/lib/utils";
import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import type { AccountType } from "@/types";

export default function NewAccountScreen() {
  const createAccount = useCreateAccount();

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("checking");
  const [currency, setCurrency] = useState("USD");
  const [balanceCents, setBalanceCents] = useState(0);
  const [color, setColor] = useState(AccountTypeColors.checking);
  const [hasCustomColor, setHasCustomColor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selectedType = ACCOUNT_TYPE_META[type];

  function handleTypeChange(nextType: AccountType) {
    setType(nextType);

    if (!hasCustomColor) {
      setColor(ACCOUNT_TYPE_META[nextType].color);
    }
  }

  function handleColorChange(nextColor: string) {
    setColor(nextColor);
    setHasCustomColor(true);
  }

  async function handleCreate() {
    if (!name.trim()) {
      setError("Add an account name so it can show up clearly across your ledger.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createAccount.mutateAsync({
        name: name.trim(),
        type,
        currency,
        color,
        icon: selectedType.systemIcon,
        initialBalance: balanceCents,
        excludeFromTotal: false,
        sortOrder: 0,
      });
      router.back();
    } catch {
      setError("We couldn't create this account. Try again in a moment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-surface">
      <Stack.Screen options={{ title: "Add Account" }} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="gap-5 px-5 pb-safe-offset-24 pt-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-2">
            <Text className="font-heading-normal text-4xl italic text-ink">Add account 💳</Text>
            <Text className="font-body-normal text-sm leading-6 text-ink/50">
              Build a fresh ledger space for spending, saving, cash, or investing.
            </Text>
          </View>

          <Animated.View entering={FadeInDown.duration(220)} layout={layoutTransition}>
            <AccountPreviewCard
              balanceCents={balanceCents}
              color={color}
              currency={currency}
              name={name}
              type={type}
            />
          </Animated.View>

          <View className="gap-4 rounded-3xl border border-ledger-outline bg-surface-container p-5">
            <Text className="font-heading-normal text-xl italic text-ink">Identity ✍️</Text>

            <View className="gap-2">
              <Text className="font-body-medium text-sm text-ink/60">Account name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Main Checking"
                placeholderTextColor="#9a9896"
                autoFocus
                returnKeyType="done"
                className="rounded-2xl border border-ledger-outline bg-surface px-4 py-3 text-base text-ink"
              />
            </View>

            <View className="gap-2">
              <Text className="font-body-medium text-sm text-ink/60">Opening balance</Text>
              <AmountInput
                valueCents={balanceCents}
                onChangeCents={setBalanceCents}
                currency={currency}
              />
            </View>
          </View>

          <View className="gap-4 rounded-3xl border border-ledger-outline bg-surface-container p-5">
            <View className="gap-1">
              <Text className="font-heading-normal text-xl italic text-ink">Type 🧩</Text>
              <Text className="font-body-normal text-sm leading-6 text-ink/50">
                Pick the bucket that best matches how this account behaves in the app.
              </Text>
            </View>

            <AccountTypePicker value={type} onChange={handleTypeChange} />

            <Animated.View layout={layoutTransition}>
              <Text className="font-body-normal text-sm leading-6 text-ink/50">
                {selectedType.description}
              </Text>
            </Animated.View>
          </View>

          <View className="gap-4 rounded-3xl border border-ledger-outline bg-surface-container p-5">
            <View className="gap-1">
              <Text className="font-heading-normal text-xl italic text-ink">Currency 💱</Text>
              <Text className="font-body-normal text-sm leading-6 text-ink/50">
                Choose the currency used for this account&apos;s balances and entries.
              </Text>
            </View>

            <AccountCurrencyPicker value={currency} onChange={setCurrency} />
          </View>

          <View className="gap-4 rounded-3xl border border-ledger-outline bg-surface-container p-5">
            <View className="gap-1">
              <Text className="font-heading-normal text-xl italic text-ink">Color 🎨</Text>
              <Text className="font-body-normal text-sm leading-6 text-ink/50">
                Tint the preview so this account is easier to spot across the ledger.
              </Text>
            </View>

            <ColorPicker value={color} onChange={handleColorChange} />
          </View>
        </ScrollView>

        <Animated.View
          layout={layoutTransition}
          className="border-t border-ledger-outline bg-surface px-5 pb-safe pt-4"
        >
          {error ? (
            <Animated.View entering={FadeInDown.duration(180)} exiting={FadeOutUp.duration(180)}>
              <Text className="mb-3 text-center font-body-medium text-sm text-destructive">
                {error}
              </Text>
            </Animated.View>
          ) : null}

          <Pressable
            onPress={handleCreate}
            disabled={saving}
            className={cn(
              "items-center rounded-2xl bg-ink px-4 py-4 active:bg-ink/90",
              saving && "opacity-60",
            )}
          >
            <Text className="font-body-semibold text-base text-surface">
              {saving ? "Creating…" : "Create Account"}
            </Text>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
