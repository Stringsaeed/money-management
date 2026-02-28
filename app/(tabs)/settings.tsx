import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { Easing, LinearTransition } from "react-native-reanimated";

import { useCategories } from "@/hooks/use-categories";
import { useRecurringPayments } from "@/hooks/use-recurring-payments";
import type { Category } from "@/types";

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 pt-6 pb-2">
      {title}
    </Text>
  );
}

function Divider() {
  return <View className="h-px bg-gray-100 ml-4" />;
}

interface SettingsRowProps {
  emoji: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
}

function SettingsRow({ emoji, label, subtitle, onPress }: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-3.5 gap-3 active:bg-gray-50"
    >
      <Text className="text-xl w-7 text-center">{emoji}</Text>
      <View className="flex-1">
        <Text className="text-base text-gray-900">{label}</Text>
        {subtitle ? <Text className="text-[13px] text-gray-500 mt-0.5">{subtitle}</Text> : null}
      </View>
      <Text className="text-gray-400 text-lg">›</Text>
    </Pressable>
  );
}

function CategoryRow({ category }: { category: Category }) {
  return (
    <Pressable
      onPress={() => router.push(`/category/${category.id}/edit`)}
      className="flex-row items-center px-4 py-3 gap-3 active:bg-gray-50"
    >
      <View style={{ backgroundColor: category.color }} className="w-2.5 h-2.5 rounded-full" />
      <Text className="flex-1 text-[15px] text-gray-900">{category.name}</Text>
      <Text className="text-gray-400">›</Text>
    </Pressable>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="bg-white rounded-xl mx-4 overflow-hidden"
      style={{ borderCurve: "continuous" }}
    >
      {children}
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { data: expenseCategories = [] } = useCategories("expense");
  const { data: incomeCategories = [] } = useCategories("income");
  const { data: recurring = [] } = useRecurringPayments();

  const totalCategories = expenseCategories.length + incomeCategories.length;
  const activeRecurring = recurring.filter((r) => r.isActive).length;

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="pb-10">
      {/* Header */}
      <View className="bg-white pt-safe-offset-2 pb-4 px-5 border-b border-gray-100">
        <Text className="text-[28px] font-bold text-gray-900">Settings ⚙️</Text>
      </View>

      {/* Manage */}
      <SectionHeader title="Manage" />
      <Card>
        <SettingsRow
          emoji="🏷️"
          label="Categories"
          subtitle={`${totalCategories} categories`}
          onPress={() => router.push("/category/new")}
        />
        <Divider />
        <SettingsRow
          emoji="🔁"
          label="Recurring Payments"
          subtitle={`${activeRecurring} active`}
          onPress={() => router.push("/recurring/index")}
        />
        <Divider />
        <SettingsRow emoji="🏦" label="Add Account" onPress={() => router.push("/account/new")} />
      </Card>

      {/* Expense categories */}
      <SectionHeader title="Expense Categories 💸" />
      <Animated.View
        layout={LinearTransition.easing(Easing.ease)}
        className="bg-white rounded-xl mx-4 overflow-hidden"
        style={{ borderCurve: "continuous" }}
      >
        {expenseCategories.map((cat, i) => (
          <View key={cat.id}>
            {i > 0 && <Divider />}
            <CategoryRow category={cat} />
          </View>
        ))}
        {expenseCategories.length > 0 && <Divider />}
        <SettingsRow
          emoji="＋"
          label="Add Expense Category"
          onPress={() => router.push("/category/new")}
        />
      </Animated.View>

      {/* Income categories */}
      <SectionHeader title="Income Categories 💰" />
      <Animated.View
        layout={LinearTransition.easing(Easing.ease)}
        className="bg-white rounded-xl mx-4 overflow-hidden"
        style={{ borderCurve: "continuous" }}
      >
        {incomeCategories.map((cat, i) => (
          <View key={cat.id}>
            {i > 0 && <Divider />}
            <CategoryRow category={cat} />
          </View>
        ))}
        {incomeCategories.length > 0 && <Divider />}
        <SettingsRow
          emoji="＋"
          label="Add Income Category"
          onPress={() => router.push("/category/new")}
        />
      </Animated.View>
    </ScrollView>
  );
}
