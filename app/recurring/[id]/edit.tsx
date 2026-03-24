import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  View,
} from "react-native";
import { Text } from "@/components/ui/text";

import { AccountPicker } from "@/components/account/account-picker";
import { AmountInput } from "@/components/common/amount-input";
import {
  useDeleteRecurringPayment,
  useRecurringPayment,
  useUpdateRecurringPayment,
} from "@/hooks/use-recurring-payments";
import { useAccounts } from "@/hooks/use-accounts";

export default function EditRecurringScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: rule, isLoading } = useRecurringPayment(id);
  const updateRecurring = useUpdateRecurringPayment();
  const deleteRecurring = useDeleteRecurringPayment();
  const { data: accounts = [] } = useAccounts();

  const [name, setName] = useState(rule?.name ?? "");
  const [amount, setAmount] = useState(rule?.amount ?? 0);
  const [accountId, setAccountId] = useState(rule?.accountId ?? "");
  const [isActive, setIsActive] = useState(rule?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }
  if (!rule) return null;

  const currentAccount = accounts.find((a) => a.id === accountId);
  const currency = currentAccount?.currency ?? rule.currency;

  async function handleSave() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    setSaving(true);
    try {
      await updateRecurring.mutateAsync({
        id,
        data: { name: name.trim(), amount, accountId, isActive },
      });
      router.back();
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert("Delete Recurring Payment", "This will stop generating future transactions.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteRecurring.mutateAsync(id);
          router.back();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholderTextColor="#9a9896"
            className="border border-input rounded-[10px] p-3.5 text-base text-foreground"
          />
        </View>

        {/* Amount */}
        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">Amount</Text>
          <AmountInput valueCents={amount} onChangeCents={setAmount} currency={currency} />
        </View>

        {/* Account */}
        <AccountPicker value={accountId} onChange={setAccountId} label="Account" />

        {/* Interval (read-only display) */}
        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">Frequency</Text>
          <View className="px-3.5 py-3 rounded-[10px] bg-muted">
            <Text className="text-[15px] text-foreground capitalize">{rule.interval}</Text>
          </View>
        </View>

        {/* Active toggle */}
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-[15px] font-semibold text-foreground">Active</Text>
            <Text className="text-[13px] text-muted-foreground">
              Pausing stops new transactions from being generated
            </Text>
          </View>
          <Switch value={isActive} onValueChange={setIsActive} />
        </View>

        {error ? <Text className="text-destructive text-center">{error}</Text> : null}

        <Pressable
          onPress={handleSave}
          disabled={saving}
          className="bg-brand rounded-xl p-4 items-center"
          style={{ opacity: saving ? 0.6 : 1 }}
        >
          <Text className="text-brand-foreground text-[17px] font-semibold">
            {saving ? "Saving…" : "Save Changes"}
          </Text>
        </Pressable>

        <Pressable onPress={handleDelete} className="items-center py-3">
          <Text className="text-destructive text-[15px] font-medium">Delete Recurring Payment</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
