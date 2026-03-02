import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View
} from "react-native";
import { Text } from "@/components/ui/text";

import { ColorPicker } from "@/components/common/color-picker";
import { AccountTypeColors } from "@/constants/theme";
import { useAccount, useDeleteAccount, useUpdateAccount } from "@/hooks/use-accounts";
import type { AccountType } from "@/types";

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card" },
  { value: "investment", label: "Investment" },
  { value: "other", label: "Other" },
];

export default function EditAccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: account, isLoading } = useAccount(id);
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType>((account?.type as AccountType) ?? "checking");
  const [color, setColor] = useState(account?.color ?? "#4A90D9");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Once account loads, update local state
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }
  if (!account) return null;

  async function handleSave() {
    if (!name.trim()) {
      setError("Account name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateAccount.mutateAsync({
        id,
        data: { name: name.trim(), type, color },
      });
      router.back();
    } catch {
      setError("Failed to update account.");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      "Delete Account",
      "This will permanently delete the account and all its transactions. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteAccount.mutateAsync(id);
            router.replace("/(tabs)/settings");
          },
        },
      ],
    );
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
            Account Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
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
          <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#374151" }}>
            Account Type
          </Text>
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
                <Text style={{ fontSize: 14, fontWeight: type === at.value ? "600" : "400" }}>
                  {at.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Color */}
        <View>
          <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#374151" }}>
            Color
          </Text>
          <ColorPicker value={color} onChange={setColor} />
        </View>

        {error ? <Text style={{ color: "#DC2626", textAlign: "center" }}>{error}</Text> : null}

        <Pressable
          onPress={handleSave}
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
            {saving ? "Saving…" : "Save Changes"}
          </Text>
        </Pressable>

        <Pressable onPress={handleDelete} style={{ alignItems: "center", paddingVertical: 12 }}>
          <Text style={{ color: "#DC2626", fontSize: 15, fontWeight: "500" }}>Delete Account</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
