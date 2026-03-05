import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View
} from "react-native";
import { Text } from "@/components/ui/text";

import { ColorPicker } from "@/components/common/color-picker";
import { AccountTypeColors, ColorPalette } from "@/constants/theme";
import { useCreateAccount } from "@/hooks/use-accounts";
import { decimalStringToCents } from "@/utils/currency";
import type { AccountType } from "@/types";

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card" },
  { value: "investment", label: "Investment" },
  { value: "other", label: "Other" },
];

const CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CHF",
  "CNY",
  "SAR",
  "AED",
  "INR",
  "BRL",
  "MXN",
];

function FieldLabel({ children }: { children: string }) {
  return (
    <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#374151" }}>
      {children}
    </Text>
  );
}

export default function NewAccountScreen() {
  const createAccount = useCreateAccount();

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("checking");
  const [currency, setCurrency] = useState("USD");
  const [balance, setBalance] = useState("0");
  const [color, setColor] = useState(ColorPalette[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!name.trim()) {
      setError("Account name is required");
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
        icon: "banknote.fill",
        initialBalance: decimalStringToCents(balance),
        excludeFromTotal: false,
        sortOrder: 0,
      });
      router.back();
    } catch {
      setError("Failed to create account. Please try again.");
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
          <FieldLabel>Account Name</FieldLabel>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Main Checking"
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
        <View>
          <FieldLabel>Account Type</FieldLabel>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {ACCOUNT_TYPES.map((at) => (
              <Pressable
                key={at.value}
                onPress={() => setType(at.value)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: type === at.value ? AccountTypeColors[at.value] : "#D1D5DB",
                  backgroundColor:
                    type === at.value ? `${AccountTypeColors[at.value]}20` : "transparent",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: type === at.value ? "600" : "400",
                    color: type === at.value ? AccountTypeColors[at.value] : "#374151",
                  }}
                >
                  {at.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Currency */}
        <View>
          <FieldLabel>Currency</FieldLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCurrency(c)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 2,
                    borderColor: currency === c ? "#0a7ea4" : "#D1D5DB",
                    backgroundColor: currency === c ? "#0a7ea420" : "transparent",
                  }}
                >
                  <Text style={{ fontWeight: currency === c ? "600" : "400" }}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Initial Balance */}
        <View>
          <FieldLabel>Starting Balance</FieldLabel>
          <TextInput
            value={balance}
            onChangeText={setBalance}
            keyboardType="decimal-pad"
            placeholder="0.00"
            style={{
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 10,
              padding: 14,
              fontSize: 16,
            }}
          />
        </View>

        {/* Color */}
        <View>
          <FieldLabel>Color</FieldLabel>
          <ColorPicker value={color} onChange={setColor} />
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
            {saving ? "Creating…" : "Create Account"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
