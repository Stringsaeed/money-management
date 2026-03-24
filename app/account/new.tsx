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
  return <Text className="text-sm font-semibold text-foreground mb-2">{children}</Text>;
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
      className="flex-1 bg-background"
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
            placeholderTextColor="#9a9896"
            autoFocus
            className="border border-input rounded-[10px] p-3.5 text-base text-foreground"
          />
        </View>

        {/* Type */}
        <View>
          <FieldLabel>Account Type</FieldLabel>
          <View className="flex-row flex-wrap gap-2">
            {ACCOUNT_TYPES.map((at) => (
              <Pressable
                key={at.value}
                onPress={() => setType(at.value)}
                style={{
                  borderColor: type === at.value ? AccountTypeColors[at.value] : undefined,
                  backgroundColor:
                    type === at.value ? `${AccountTypeColors[at.value]}20` : undefined,
                }}
                className={`px-3.5 py-2 rounded-full border-2 ${type === at.value ? "" : "border-input"}`}
              >
                <Text
                  style={type === at.value ? { color: AccountTypeColors[at.value] } : undefined}
                  className={`text-sm ${type === at.value ? "font-semibold" : "text-foreground"}`}
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
            <View className="flex-row gap-2">
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCurrency(c)}
                  className={`px-4 py-2 rounded-full border-2 ${currency === c ? "border-brand bg-brand/10" : "border-input"}`}
                >
                  <Text className={`text-foreground ${currency === c ? "font-semibold" : ""}`}>
                    {c}
                  </Text>
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
            placeholderTextColor="#9a9896"
            className="border border-input rounded-[10px] p-3.5 text-base text-foreground"
          />
        </View>

        {/* Color */}
        <View>
          <FieldLabel>Color</FieldLabel>
          <ColorPicker value={color} onChange={setColor} />
        </View>

        {error ? <Text className="text-destructive text-center">{error}</Text> : null}

        <Pressable
          onPress={handleCreate}
          disabled={saving}
          className="bg-brand rounded-xl p-4 items-center"
          style={{ opacity: saving ? 0.6 : 1 }}
        >
          <Text className="text-brand-foreground text-[17px] font-semibold">
            {saving ? "Creating…" : "Create Account"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
