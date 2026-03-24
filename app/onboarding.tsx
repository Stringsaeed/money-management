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
      router.replace("/");
    } catch {
      setError("Failed to create account. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
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
          <View className="mb-8 mt-12">
            <Text className="text-[32px] font-bold text-foreground mb-2">Welcome 👋</Text>
            <Text className="text-base text-muted-foreground">
              Let&apos;s set up your first account to get started.
            </Text>
          </View>

          {/* Account Name */}
          <Text className="text-sm font-semibold text-foreground mb-2">Account Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Main Checking"
            placeholderTextColor="#9a9896"
            className="border border-input rounded-[10px] p-3.5 text-base text-foreground mb-5"
            autoFocus
            returnKeyType="next"
          />

          {/* Account Type */}
          <Text className="text-sm font-semibold text-foreground mb-2">Account Type</Text>
          <Animated.View
            layout={LinearTransition.easing(Easing.ease)}
            className="flex-row flex-wrap gap-2 mb-5"
          >
            {ACCOUNT_TYPES.map((at) => (
              <Animated.View key={at.value} layout={LinearTransition.easing(Easing.ease)}>
                <Pressable
                  onPress={() => setType(at.value)}
                  style={{
                    borderColor: type === at.value ? AccountTypeColors[at.value] : undefined,
                    backgroundColor:
                      type === at.value ? `${AccountTypeColors[at.value]}20` : undefined,
                  }}
                  className={twMerge(
                    "px-3.5 py-2 rounded-full border-2 border-input",
                    type === at.value && "border-transparent",
                  )}
                >
                  <Text
                    className={twMerge(
                      "text-sm text-foreground",
                      type === at.value && "font-semibold",
                    )}
                  >
                    {at.icon} {at.label}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Currency */}
          <Text className="text-sm font-semibold text-foreground mb-2">Currency</Text>
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
                    "self-start px-4 py-2 rounded-full border-2 border-input",
                    currency === c && "border-brand bg-brand/10",
                  )}
                >
                  <Text className={twMerge("text-foreground", currency === c && "font-semibold")}>
                    {c}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </Animated.ScrollView>

          {/* Initial Balance */}
          <Text className="text-sm font-semibold text-foreground mb-2">Starting Balance</Text>
          <TextInput
            value={balance}
            onChangeText={setBalance}
            keyboardType="decimal-pad"
            className="border border-input rounded-[10px] p-3.5 text-base text-foreground mb-5"
            placeholder="0.00"
            placeholderTextColor="#9a9896"
          />

          {/* Color */}
          <Text className="text-sm font-semibold text-foreground">Color</Text>
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
                      ? "w-9 h-9 rounded-full border-[3px] border-background shadow"
                      : "w-9 h-9 rounded-full"
                  }
                />
              </Animated.View>
            ))}
          </Animated.ScrollView>

          {error ? <Text className="text-destructive mb-4 text-center">{error}</Text> : null}

          {/* Create Button */}
        </Animated.ScrollView>
      </KeyboardAvoidingView>
      <Animated.View className="px-4 pb-safe py-2">
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
      </Animated.View>
    </View>
  );
}
