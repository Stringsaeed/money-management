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
  View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { inputTextStyle } from "@/components/ui/input-style";
import { Text } from "@/components/ui/text";

import { ColorPicker } from "@/components/common/color-picker";
import { accountDeletionMessage } from "@/components/account/account-deletion-message";
import { AccountTypeColors } from "@/constants/theme";
import {
  useAccount,
  useDeleteAccount,
  usePreviewAccountDeletion,
  useUpdateAccount,
} from "@/hooks/use-accounts";
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
  const previewAccountDeletion = usePreviewAccountDeletion();

  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType>((account?.type as AccountType) ?? "checking");
  const [color, setColor] = useState(account?.color ?? "#4A90D9");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Once account loads, update local state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }
  if (!account) return null;
  const accountName = account.name;

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

  async function handleDelete() {
    try {
      const preview = await previewAccountDeletion.mutateAsync(id);
      Alert.alert("Delete Account", accountDeletionMessage(accountName, preview), [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteAccount.mutateAsync(id);
            router.replace("/settings");
          },
        },
      ]);
    } catch {
      Alert.alert(
        "Couldn't Check Recurring Rules",
        "The account was not deleted. Please try again.",
      );
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
          <Text className="text-sm font-semibold text-foreground mb-2">Account Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholderTextColor="#9a9896"
            className="border border-input rounded-[10px] p-3.5 text-base leading-5 text-foreground"
            style={inputTextStyle}
          />
        </View>

        {/* Type */}
        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">Account Type</Text>
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
                  className={`text-sm text-foreground ${type === at.value ? "font-semibold" : ""}`}
                >
                  {at.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Color */}
        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">Color</Text>
          <ColorPicker value={color} onChange={setColor} />
        </View>

        {error ? <Text className="text-destructive text-center">{error}</Text> : null}

        <Button onPress={handleSave} disabled={saving} size="xl">
          <Text>{saving ? "Saving…" : "Save Changes"}</Text>
        </Button>

        <Pressable onPress={() => void handleDelete()} className="items-center py-3">
          <Text className="text-destructive text-[15px] font-medium">Delete Account</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
