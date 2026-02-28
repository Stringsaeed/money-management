import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useCategories } from "@/hooks/use-categories";
import { useRecurringPayments } from "@/hooks/use-recurring-payments";

function SettingsRow({
  label,
  subtitle,
  onPress,
}: {
  label: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: pressed ? "#F9FAFB" : "white",
      })}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, color: "#111827" }}>{label}</Text>
        {subtitle ? (
          <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>{subtitle}</Text>
        ) : null}
      </View>
      <Text style={{ color: "#9CA3AF", fontSize: 18 }}>›</Text>
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: "600",
        color: "#6B7280",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 8,
      }}
    >
      {title}
    </Text>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: "#F3F4F6", marginLeft: 16 }} />;
}

export default function SettingsScreen() {
  const { data: expenseCategories = [] } = useCategories("expense");
  const { data: incomeCategories = [] } = useCategories("income");
  const { data: recurring = [] } = useRecurringPayments();

  const totalCategories = expenseCategories.length + incomeCategories.length;
  const activeRecurring = recurring.filter((r) => r.isActive).length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: "white",
          paddingTop: 60,
          paddingBottom: 16,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: "700", color: "#111827" }}>Settings</Text>
      </View>

      {/* Manage section */}
      <SectionHeader title="Manage" />
      <View
        style={{
          backgroundColor: "white",
          borderRadius: 12,
          marginHorizontal: 16,
          overflow: "hidden",
        }}
      >
        <SettingsRow
          label="Categories"
          subtitle={`${totalCategories} categories`}
          onPress={() => router.push("/category/new")}
        />
        <Divider />
        <SettingsRow
          label="Recurring Payments"
          subtitle={`${activeRecurring} active`}
          onPress={() => router.push("/recurring/index")}
        />
        <Divider />
        <SettingsRow label="Add Account" onPress={() => router.push("/account/new")} />
      </View>

      {/* Categories quick view */}
      <SectionHeader title="Expense Categories" />
      <View
        style={{
          backgroundColor: "white",
          borderRadius: 12,
          marginHorizontal: 16,
          overflow: "hidden",
        }}
      >
        {expenseCategories.map((cat, i) => (
          <View key={cat.id}>
            {i > 0 && <Divider />}
            <Pressable
              onPress={() => router.push(`/category/${cat.id}/edit`)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: pressed ? "#F9FAFB" : "white",
                gap: 10,
              })}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: cat.color,
                }}
              />
              <Text style={{ flex: 1, fontSize: 15, color: "#111827" }}>{cat.name}</Text>
              <Text style={{ color: "#9CA3AF" }}>›</Text>
            </Pressable>
          </View>
        ))}
        <Divider />
        <SettingsRow label="+ Add Expense Category" onPress={() => router.push("/category/new")} />
      </View>

      <SectionHeader title="Income Categories" />
      <View
        style={{
          backgroundColor: "white",
          borderRadius: 12,
          marginHorizontal: 16,
          overflow: "hidden",
          marginBottom: 40,
        }}
      >
        {incomeCategories.map((cat, i) => (
          <View key={cat.id}>
            {i > 0 && <Divider />}
            <Pressable
              onPress={() => router.push(`/category/${cat.id}/edit`)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: pressed ? "#F9FAFB" : "white",
                gap: 10,
              })}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: cat.color,
                }}
              />
              <Text style={{ flex: 1, fontSize: 15, color: "#111827" }}>{cat.name}</Text>
              <Text style={{ color: "#9CA3AF" }}>›</Text>
            </Pressable>
          </View>
        ))}
        <Divider />
        <SettingsRow label="+ Add Income Category" onPress={() => router.push("/category/new")} />
      </View>
    </ScrollView>
  );
}
