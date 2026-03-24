import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { Text } from "@/components/ui/text";

import { AccountPicker } from "@/components/account/account-picker";
import { CategoryPicker } from "@/components/category/category-picker";
import { AmountInput } from "@/components/common/amount-input";
import { useAccounts } from "@/hooks/use-accounts";
import { useCreateRecurringPayment } from "@/hooks/use-recurring-payments";
import { today } from "@/utils/date";
import type { RecurrenceInterval, TransactionType } from "@/types";

const TYPE_OPTIONS: { value: TransactionType; label: string; activeClass: string }[] = [
  { value: "expense", label: "Expense", activeClass: "bg-destructive" },
  { value: "income", label: "Income", activeClass: "bg-secondary" },
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
            placeholder="e.g. Netflix, Rent"
            placeholderTextColor="#9a9896"
            autoFocus
            className="border border-input rounded-[10px] p-3.5 text-base text-foreground"
          />
        </View>

        {/* Type */}
        <View className="flex-row rounded-[10px] overflow-hidden border border-border">
          {TYPE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setType(opt.value)}
              className={`flex-1 py-3 items-center ${type === opt.value ? opt.activeClass : "bg-card"}`}
            >
              <Text
                className={`font-semibold ${type === opt.value ? "text-white" : "text-foreground"}`}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Amount */}
        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">Amount</Text>
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
          <Text className="text-sm font-semibold text-foreground mb-2">Frequency</Text>
          <View className="flex-row flex-wrap gap-2">
            {INTERVAL_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setInterval(opt.value)}
                className={`px-4 py-2 rounded-full border-2 ${interval === opt.value ? "border-brand bg-brand/10" : "border-input"}`}
              >
                <Text
                  className={`text-foreground ${interval === opt.value ? "font-semibold" : ""}`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Day of month (monthly/yearly) */}
        {(interval === "monthly" || interval === "yearly") && (
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Day of Month (1–31)</Text>
            <TextInput
              value={dayOfMonth}
              onChangeText={setDayOfMonth}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor="#9a9896"
              className="border border-input rounded-[10px] p-3.5 text-base text-foreground w-[100px]"
            />
          </View>
        )}

        {/* Start date */}
        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">
            Start Date (YYYY-MM-DD)
          </Text>
          <TextInput
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9a9896"
            className="border border-input rounded-[10px] p-3.5 text-base text-foreground"
          />
        </View>

        {/* Note */}
        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">Note (optional)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add a note…"
            placeholderTextColor="#9a9896"
            className="border border-input rounded-[10px] p-3.5 text-base text-foreground"
          />
        </View>

        {error ? <Text className="text-destructive text-center">{error}</Text> : null}

        <Pressable
          onPress={handleCreate}
          disabled={saving}
          className="bg-brand rounded-xl p-4 items-center"
          style={{ opacity: saving ? 0.6 : 1 }}
        >
          <Text className="text-brand-foreground text-[17px] font-semibold">
            {saving ? "Creating…" : "Create Recurring Payment"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
