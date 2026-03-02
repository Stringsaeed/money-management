import { router } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, { Easing, LinearTransition } from "react-native-reanimated";

import { useAccountsWithBalances } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { useRecurringPayments } from "@/hooks/use-recurring-payments";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCents } from "@/utils/currency";
import type { AccountWithBalance, Category } from "@/types";

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

interface SettingsRowProps {
  emoji: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightLabel?: string;
  noChevron?: boolean;
}

function SettingsRow({ emoji, label, subtitle, onPress, rightLabel, noChevron }: SettingsRowProps) {
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
      {rightLabel ? (
        <Text
          className="text-sm text-gray-500 font-medium"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {rightLabel}
        </Text>
      ) : null}
      {!noChevron && <Text className="text-gray-300 text-lg">›</Text>}
    </Pressable>
  );
}

const ACCOUNT_EMOJI: Record<string, string> = {
  checking: "💳",
  savings: "🏦",
  cash: "💵",
  credit_card: "💳",
  investment: "📈",
  other: "🏧",
};

const ACCOUNT_LABEL: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  cash: "Cash",
  credit_card: "Credit Card",
  investment: "Investment",
  other: "Other",
};

function AccountRow({ account }: { account: AccountWithBalance }) {
  return (
    <Pressable
      onPress={() => router.push(`/account/${account.id}`)}
      className="flex-row items-center px-4 py-3.5 gap-3 active:bg-gray-50"
    >
      <View
        style={{ backgroundColor: `${account.color}20` }}
        className="w-9 h-9 rounded-full items-center justify-center"
      >
        <Text className="text-base">{ACCOUNT_EMOJI[account.type] ?? "🏧"}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base text-gray-900">{account.name}</Text>
        <Text className="text-[13px] text-gray-500 mt-0.5">
          {ACCOUNT_LABEL[account.type] ?? account.type} · {account.currency}
        </Text>
      </View>
      <Text
        className={`text-[15px] font-semibold ${account.balance < 0 ? "text-red-500" : "text-gray-900"}`}
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {account.balance < 0 ? "-" : ""}
        {formatCents(Math.abs(account.balance), account.currency)}
      </Text>
      <Text className="text-gray-300 text-lg ml-1">›</Text>
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
      <Text className="text-gray-300">›</Text>
    </Pressable>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { data: accounts = [] } = useAccountsWithBalances();
  const { data: expenseCategories = [] } = useCategories("expense");
  const { data: incomeCategories = [] } = useCategories("income");
  const { data: recurring = [] } = useRecurringPayments();
  const { data: allTransactions = [] } = useTransactions({});

  const totalCategories = expenseCategories.length + incomeCategories.length;
  const activeRecurring = recurring.filter((r) => r.isActive).length;

  // Net worth across all non-excluded accounts, by currency
  const currencies = [...new Set(accounts.map((a) => a.currency))];
  const hasMixedCurrencies = currencies.length > 1;

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="pb-12">
        {/* Accounts */}
        <SectionHeader title="Accounts 💳" />
        <Animated.View
          layout={LinearTransition.easing(Easing.ease)}
          className="bg-white rounded-xl mx-4 overflow-hidden"
          style={{ borderCurve: "continuous" }}
        >
          {accounts.map((account, i) => (
            <View key={account.id}>
              {i > 0 && <Divider />}
              <AccountRow account={account} />
            </View>
          ))}
          {accounts.length > 0 && <Divider />}
          <SettingsRow emoji="＋" label="Add Account" onPress={() => router.push("/account/new")} />
        </Animated.View>

        {/* Net worth summary */}
        {accounts.length > 0 && (
          <View
            className="mx-4 mt-2 px-4 py-3 rounded-xl bg-gray-100"
            style={{ borderCurve: "continuous" }}
          >
            <Text className="text-[11px] text-gray-500 uppercase tracking-wide mb-1">
              💰 Net Worth (excl. excluded)
            </Text>
            {hasMixedCurrencies ? (
              currencies.map((cur) => {
                const total = accounts
                  .filter((a) => !a.excludeFromTotal && a.currency === cur)
                  .reduce((s, a) => s + a.balance, 0);
                return (
                  <Text
                    key={cur}
                    className="text-[15px] font-bold text-gray-900"
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {formatCents(total, cur)}
                  </Text>
                );
              })
            ) : (
              <Text
                className="text-[15px] font-bold text-gray-900"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {formatCents(
                  accounts.filter((a) => !a.excludeFromTotal).reduce((s, a) => s + a.balance, 0),
                  currencies[0] ?? "USD",
                )}
              </Text>
            )}
          </View>
        )}

        {/* Manage */}
        <SectionHeader title="Manage 🛠️" />
        <Card>
          <SettingsRow
            emoji="🏷️"
            label="Categories"
            subtitle={`${totalCategories} ${totalCategories === 1 ? "category" : "categories"}`}
            onPress={() => router.push("/category/new")}
          />
          <Divider />
          <SettingsRow
            emoji="🔁"
            label="Recurring Payments"
            subtitle={`${activeRecurring} active`}
            onPress={() => router.push("/recurring")}
          />
        </Card>

        {/* Stats */}
        <SectionHeader title="Stats 📊" />
        <Card>
          <SettingsRow
            emoji="🧾"
            label="Total Transactions"
            rightLabel={String(allTransactions.length)}
            noChevron
          />
          <Divider />
          <SettingsRow emoji="🏦" label="Accounts" rightLabel={String(accounts.length)} noChevron />
          <Divider />
          <SettingsRow
            emoji="🔁"
            label="Active Recurring"
            rightLabel={String(activeRecurring)}
            noChevron
          />
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

        {/* About */}
        <SectionHeader title="About ℹ️" />
        <Card>
          <View className="items-center px-4 py-5 gap-1">
            <Text className="text-4xl mb-2">💰</Text>
            <Text className="text-base font-semibold text-gray-900">Money Manager</Text>
            <Text className="text-[13px] text-gray-500">Track your finances, simply.</Text>
            <Text className="text-[11px] text-gray-400 mt-2">Version 1.0.0</Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
