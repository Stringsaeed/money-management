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
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
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
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#374151" }}>
            Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={{
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 10,
              padding: 14,
              fontSize: 16,
            }}
          />
        </View>

        {/* Amount */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#374151" }}>
            Amount
          </Text>
          <AmountInput valueCents={amount} onChangeCents={setAmount} currency={currency} />
        </View>

        {/* Account */}
        <AccountPicker value={accountId} onChange={setAccountId} label="Account" />

        {/* Interval (read-only display) */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#374151" }}>
            Frequency
          </Text>
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: "#F3F4F6",
            }}
          >
            <Text style={{ fontSize: 15, color: "#374151", textTransform: "capitalize" }}>
              {rule.interval}
            </Text>
          </View>
        </View>

        {/* Active toggle */}
        <View
          style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
        >
          <View>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#374151" }}>Active</Text>
            <Text style={{ fontSize: 13, color: "#6B7280" }}>
              Pausing stops new transactions from being generated
            </Text>
          </View>
          <Switch value={isActive} onValueChange={setIsActive} />
        </View>

        {error ? <Text style={{ color: "#DC2626", textAlign: "center" }}>{error}</Text> : null}

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={{
            backgroundColor: "#0a7ea4",
            borderRadius: 12,
            padding: 16,
            alignItems: "center",
            opacity: saving ? 0.6 : 1,
          }}
        >
          <Text style={{ color: "white", fontSize: 17, fontWeight: "600" }}>
            {saving ? "Saving…" : "Save Changes"}
          </Text>
        </Pressable>

        <Pressable onPress={handleDelete} style={{ alignItems: "center", paddingVertical: 12 }}>
          <Text style={{ color: "#DC2626", fontSize: 15, fontWeight: "500" }}>
            Delete Recurring Payment
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
