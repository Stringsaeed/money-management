import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { AccountPicker } from "@/components/account/account-picker";
import { CategoryPicker } from "@/components/category/category-picker";
import { AmountInput } from "@/components/common/amount-input";
import { useAccounts } from "@/hooks/use-accounts";
import { useCreateRecurringPayment } from "@/hooks/use-recurring-payments";
import { today } from "@/utils/date";
import type { RecurrenceInterval, TransactionType } from "@/types";

const TYPE_OPTIONS: { value: TransactionType; label: string; color: string }[] = [
  { value: "expense", label: "Expense", color: "#DC2626" },
  { value: "income", label: "Income", color: "#16A34A" },
];

const INTERVAL_OPTIONS: { value: RecurrenceInterval; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export default function NewRecurringScreen() {
  const createRecurring = useCreateRecurringPayment();
  const { data: accounts = [] } = useAccounts();
  const firstAccountId = accounts[0]?.id ?? "";
  const firstAccountCurrency = accounts[0]?.currency ?? "USD";

  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState(0);
  const [accountId, setAccountId] = useState(firstAccountId);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [interval, setInterval] = useState<RecurrenceInterval>("monthly");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [startDate, setStartDate] = useState(today());
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentAccount = accounts.find((a) => a.id === accountId);
  const currency = currentAccount?.currency ?? firstAccountCurrency;

  async function handleCreate() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    if (!accountId) {
      setError("Please select an account");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await createRecurring.mutateAsync({
        name: name.trim(),
        type,
        amount,
        currency,
        accountId,
        toAccountId: null,
        categoryId,
        description,
        interval,
        dayOfMonth:
          interval === "monthly" || interval === "yearly" ? parseInt(dayOfMonth) || 1 : null,
        dayOfWeek: null,
        monthOfYear: null,
        startDate,
        endDate: null,
        lastGeneratedDate: null,
        isActive: true,
      });
      router.back();
    } catch {
      setError("Failed to create recurring payment.");
    } finally {
      setSaving(false);
    }
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
            placeholder="e.g. Netflix, Rent"
            autoFocus
            style={{
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 10,
              padding: 14,
              fontSize: 16,
            }}
          />
        </View>

        {/* Type */}
        <View
          style={{
            flexDirection: "row",
            borderRadius: 10,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          {TYPE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setType(opt.value)}
              style={{
                flex: 1,
                paddingVertical: 12,
                alignItems: "center",
                backgroundColor: type === opt.value ? opt.color : "white",
              }}
            >
              <Text style={{ fontWeight: "600", color: type === opt.value ? "white" : "#374151" }}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
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

        {/* Category */}
        {(type === "expense" || type === "income") && (
          <CategoryPicker
            value={categoryId}
            onChange={setCategoryId}
            type={type}
            label="Category"
          />
        )}

        {/* Interval */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#374151" }}>
            Frequency
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {INTERVAL_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setInterval(opt.value)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: interval === opt.value ? "#0a7ea4" : "#D1D5DB",
                  backgroundColor: interval === opt.value ? "#0a7ea420" : "transparent",
                }}
              >
                <Text style={{ fontWeight: interval === opt.value ? "600" : "400" }}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Day of month (monthly/yearly) */}
        {(interval === "monthly" || interval === "yearly") && (
          <View>
            <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#374151" }}>
              Day of Month (1–31)
            </Text>
            <TextInput
              value={dayOfMonth}
              onChangeText={setDayOfMonth}
              keyboardType="number-pad"
              placeholder="1"
              style={{
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 10,
                padding: 14,
                fontSize: 16,
                width: 100,
              }}
            />
          </View>
        )}

        {/* Start date */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#374151" }}>
            Start Date (YYYY-MM-DD)
          </Text>
          <TextInput
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            style={{
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 10,
              padding: 14,
              fontSize: 16,
            }}
          />
        </View>

        {/* Note */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#374151" }}>
            Note (optional)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add a note…"
            style={{
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 10,
              padding: 14,
              fontSize: 16,
            }}
          />
        </View>

        {error ? <Text style={{ color: "#DC2626", textAlign: "center" }}>{error}</Text> : null}

        <Pressable
          onPress={handleCreate}
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
            {saving ? "Creating…" : "Create Recurring Payment"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
