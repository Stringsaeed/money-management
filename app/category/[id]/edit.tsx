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
      <View className="flex-1 items-center justify-center bg-background">
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
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">Category Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholderTextColor="#9a9896"
            className="border border-input rounded-[10px] p-3.5 text-base text-foreground"
          />
        </View>

        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">Type</Text>
          <View
            className={`px-3.5 py-2.5 rounded-[10px] ${category.type === "expense" ? "bg-destructive/10" : "bg-secondary/20"}`}
          >
            <Text
              className={`font-semibold ${category.type === "expense" ? "text-destructive" : "text-secondary"}`}
            >
              {category.type === "expense" ? "Expense" : "Income"}
            </Text>
          </View>
        </View>

        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">Icon</Text>
          <EmojiPicker value={icon} onChange={setIcon} />
        </View>

        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">Color</Text>
          <ColorPicker value={color} onChange={setColor} />
        </View>

        {error ? <Text className="text-destructive text-center">{error}</Text> : null}

        <Button onPress={handleSave} disabled={saving} size="xl">
          <Text>{saving ? "Saving…" : "Save Changes"}</Text>
        </Button>

        <Pressable onPress={handleDelete} className="items-center py-3">
          <Text className="text-destructive text-[15px] font-medium">Delete Category</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
