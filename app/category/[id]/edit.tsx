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
import { Text } from "@/components/ui/text";

import { ColorPicker } from "@/components/common/color-picker";
import { EmojiPicker } from "@/components/common/emoji-picker";
import { useCategory, useDeleteCategory, useUpdateCategory } from "@/hooks/use-categories";

export default function EditCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: category, isLoading } = useCategory(id);
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState(category?.color ?? "#FF6B6B");
  const [icon, setIcon] = useState(category?.icon ?? "🏷️");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }
  if (!category) return null;

  async function handleSave() {
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }
    setSaving(true);
    try {
      await updateCategory.mutateAsync({ id, data: { name: name.trim(), color, icon } });
      router.back();
    } catch {
      setError("Failed to update category.");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      "Delete Category",
      "Transactions using this category will keep their data but lose the category link.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteCategory.mutateAsync(id);
            router.back();
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
        <View>
          <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#374151" }}>
            Category Name
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

        <View>
          <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#374151" }}>
            Type
          </Text>
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: category.type === "expense" ? "#FEE2E2" : "#DCFCE7",
            }}
          >
            <Text
              style={{
                color: category.type === "expense" ? "#DC2626" : "#16A34A",
                fontWeight: "600",
              }}
            >
              {category.type === "expense" ? "Expense" : "Income"}
            </Text>
          </View>
        </View>

        <View>
          <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#374151" }}>
            Icon
          </Text>
          <EmojiPicker value={icon} onChange={setIcon} />
        </View>

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
          <Text style={{ color: "#DC2626", fontSize: 15, fontWeight: "500" }}>Delete Category</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
