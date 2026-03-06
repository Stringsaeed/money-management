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
import { today } from "@/utils/date";
import type { TransactionType } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TransactionFormData {
  type: TransactionType;
  amount: number; // cents
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  description: string;
  date: string; // "YYYY-MM-DD"
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

// ── Type toggle ───────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: TransactionType; label: string; color: string }[] = [
  { value: "expense", label: "Expense", color: "#DC2626" },
  { value: "income", label: "Income", color: "#16A34A" },
  { value: "transfer", label: "Transfer", color: "#7C3AED" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function TransactionForm({
  initialData,
  onSubmit,
  submitLabel = "Save",
  onDelete,
}: TransactionFormProps) {
  const { data: accounts = [] } = useAccounts();

  const firstAccountId = accounts[0]?.id ?? "";
  const firstAccountCurrency = accounts[0]?.currency ?? "USD";

  const [type, setType] = useState<TransactionType>(initialData?.type ?? "expense");
  const [amount, setAmount] = useState(initialData?.amount ?? 0);
  const [accountId, setAccountId] = useState(initialData?.accountId ?? firstAccountId);
  const [toAccountId, setToAccountId] = useState<string | null>(initialData?.toAccountId ?? null);
  const [categoryId, setCategoryId] = useState<string | null>(initialData?.categoryId ?? null);
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [date, setDate] = useState(initialData?.date ?? today());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentAccount = accounts.find((a) => a.id === accountId);
  const currency = currentAccount?.currency ?? firstAccountCurrency;

  async function handleSubmit() {
    if (amount <= 0) {
      setError("Please enter an amount greater than 0");
      return;
    }
    if (!accountId) {
      setError("Please select an account");
      return;
    }
    if (type === "transfer" && !toAccountId) {
      setError("Please select a destination account for the transfer");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSubmit({
        type,
        amount,
        accountId,
        toAccountId: type === "transfer" ? toAccountId : null,
        categoryId: type === "transfer" ? null : categoryId,
        description,
        date,
        currency,
        originalAmount: null,
        originalCurrency: null,
        exchangeRate: null,
      });
    } catch {
      setError("Something went wrong. Please try again.");
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
        {/* Type toggle */}
        <View
          style={{
            flexDirection: "row",
            borderRadius: 12,
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
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: type === opt.value ? "white" : "#374151",
                }}
              >
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
        <AccountPicker
          value={accountId}
          onChange={(id) => {
            setAccountId(id);
            // Reset to-account if it's now the same as from-account
            if (id === toAccountId) setToAccountId(null);
          }}
          label="Account"
        />

        {/* Destination account (transfers only) */}
        {type === "transfer" && (
          <AccountPicker
            value={toAccountId}
            onChange={setToAccountId}
            exclude={[accountId]}
            label="To Account"
          />
        )}

        {/* Category (income/expense only) */}
        {type !== "transfer" && (
          <CategoryPicker
            value={categoryId}
            onChange={setCategoryId}
            type={type}
            label="Category"
          />
        )}

        {/* Date */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#374151" }}>
            Date
          </Text>
          <TextInput
            value={date}
            onChangeText={setDate}
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

        {/* Description */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#374151" }}>
            Note (optional)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add a note…"
            multiline
            numberOfLines={2}
            style={{
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 10,
              padding: 14,
              fontSize: 16,
              minHeight: 72,
              textAlignVertical: "top",
            }}
          />
        </View>

        {error ? <Text style={{ color: "#DC2626", textAlign: "center" }}>{error}</Text> : null}

        {/* Submit */}
        <Pressable
          onPress={handleSubmit}
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
            {saving ? "Saving…" : submitLabel}
          </Text>
        </Pressable>

        {/* Delete */}
        {onDelete && (
          <Pressable onPress={onDelete} style={{ alignItems: "center", paddingVertical: 12 }}>
            <Text style={{ color: "#DC2626", fontSize: 15, fontWeight: "500" }}>
              Delete Transaction
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
