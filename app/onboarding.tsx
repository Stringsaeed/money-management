import { drizzle } from "drizzle-orm/expo-sqlite";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from "react-native";
import { Text } from "@/components/ui/text";

import { AccountTypeColors, ColorPalette } from "@/constants/theme";
import { accounts } from "@/db/schema";
import type { AccountType } from "@/types";
import { decimalStringToCents } from "@/utils/currency";
import { nowIso } from "@/utils/date";
import { generateId } from "@/utils/id";
import Animated, { Easing, LinearTransition } from "react-native-reanimated";
import { twMerge } from "tailwind-merge";

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: "checking", label: "Checking", icon: "💳" },
  { value: "savings", label: "Savings", icon: "🏦" },
  { value: "cash", label: "Cash", icon: "💵" },
  { value: "credit_card", label: "Credit Card", icon: "💳" },
  { value: "investment", label: "Investment", icon: "📈" },
  { value: "other", label: "Other", icon: "🏧" },
];

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "SAR", "AED"];

export default function OnboardingScreen() {
  const sqliteDb = useSQLiteContext();
  const db = drizzle(sqliteDb);

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
      const now = nowIso();
      await db.insert(accounts).values({
        id: generateId(),
        name: name.trim(),
        type,
        currency,
        color: color ?? AccountTypeColors[type],
        icon: "banknote.fill",
        initialBalance: decimalStringToCents(balance),
        excludeFromTotal: false,
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      });
      router.replace("/(tabs)");
    } catch {
      setError("Failed to create account. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Animated.ScrollView
          className="flex-1"
          contentContainerClassName="grow px-4 pt-safe-offset-2"
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ marginBottom: 32, marginTop: 48 }}>
            <Text style={{ fontSize: 32, fontWeight: "700", marginBottom: 8 }}>Welcome 👋</Text>
            <Text style={{ fontSize: 16, color: "#6B7280" }}>
              Let&apos;s set up your first account to get started.
            </Text>
          </View>

          {/* Account Name */}
          <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8 }}>Account Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Main Checking"
            style={{
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 10,
              padding: 14,
              fontSize: 16,
              marginBottom: 20,
            }}
            autoFocus
            returnKeyType="next"
          />

          {/* Account Type */}
          <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8 }}>Account Type</Text>
          <Animated.View
            layout={LinearTransition.easing(Easing.ease)}
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 20,
            }}
          >
            {ACCOUNT_TYPES.map((at) => (
              <Animated.View key={at.value} layout={LinearTransition.easing(Easing.ease)}>
                <Pressable
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
                    }}
                  >
                    {at.icon} {at.label}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Currency */}
          <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8 }}>Currency</Text>
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -16, flexShrink: 1, flexGrow: 0, marginBottom: 20 }}
            contentContainerClassName="px-4 gap-2 grow"
            layout={LinearTransition.easing(Easing.ease)}
          >
            {CURRENCIES.map((c) => (
              <Animated.View key={c} layout={LinearTransition.easing(Easing.ease)}>
                <Pressable
                  key={c}
                  onPress={() => setCurrency(c)}
                  className={twMerge(
                    "self-start px-4 py-2 rounded-full border-2",
                    currency === c ? "border-[#0a7ea4] bg-[#0a7ea420]" : "border-gray-300",
                  )}
                >
                  <Text style={{ fontWeight: currency === c ? "600" : "400" }}>{c}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </Animated.ScrollView>

          {/* Initial Balance */}
          <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8 }}>Starting Balance</Text>
          <TextInput
            value={balance}
            onChangeText={setBalance}
            keyboardType="decimal-pad"
            style={{
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 10,
              padding: 14,
              fontSize: 16,
              marginBottom: 20,
            }}
            placeholder="0.00"
          />

          {/* Color */}
          <Text style={{ fontSize: 14, fontWeight: "600" }}>Color</Text>
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -16, flexShrink: 1, flexGrow: 1, marginBottom: 32 }}
            contentContainerClassName="px-4 gap-2.5 grow pt-4"
            layout={LinearTransition.easing(Easing.ease)}
          >
            {ColorPalette.map((c) => (
              <Animated.View key={c} layout={LinearTransition.easing(Easing.ease)}>
                <Pressable
                  onPress={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={
                    color === c
                      ? "w-9 h-9 rounded-full border-[3px] border-white shadow"
                      : "w-9 h-9 rounded-full"
                  }
                />
              </Animated.View>
            ))}
          </Animated.ScrollView>

          {error ? (
            <Text style={{ color: "#DC2626", marginBottom: 16, textAlign: "center" }}>{error}</Text>
          ) : null}

          {/* Create Button */}
        </Animated.ScrollView>
      </KeyboardAvoidingView>
      <Animated.View className="px-4 pb-safe py-2">
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
      </Animated.View>
    </View>
  );
}
