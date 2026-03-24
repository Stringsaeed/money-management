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
import { EmojiPicker } from "@/components/common/emoji-picker";
import { ColorPalette } from "@/constants/theme";
import { useCreateCategory } from "@/hooks/use-categories";

export default function NewCategoryScreen() {
  const createCategory = useCreateCategory();
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [color, setColor] = useState(ColorPalette[0]);
  const [icon, setIcon] = useState("🏷️");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!name.trim()) {
      setError("Category name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createCategory.mutateAsync({
        name: name.trim(),
        type,
        color,
        icon,
        parentId: null,
        sortOrder: 0,
      });
      router.back();
    } catch {
      setError("Failed to create category.");
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
          <Text className="text-sm font-semibold text-foreground mb-2">Category Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Groceries"
            placeholderTextColor="#9a9896"
            autoFocus
            className="border border-input rounded-[10px] p-3.5 text-base text-foreground"
          />
        </View>

        {/* Type */}
        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">Type</Text>
          <View className="flex-row rounded-[10px] overflow-hidden border border-border">
            <Pressable
              onPress={() => setType("expense")}
              className={`flex-1 py-3 items-center ${type === "expense" ? "bg-destructive" : "bg-card"}`}
            >
              <Text
                className={`font-semibold ${type === "expense" ? "text-white" : "text-foreground"}`}
              >
                Expense
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setType("income")}
              className={`flex-1 py-3 items-center ${type === "income" ? "bg-secondary" : "bg-card"}`}
            >
              <Text
                className={`font-semibold ${type === "income" ? "text-secondary-foreground" : "text-foreground"}`}
              >
                Income
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Icon */}
        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">Icon</Text>
          <EmojiPicker value={icon} onChange={setIcon} />
        </View>

        {/* Color */}
        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">Color</Text>
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
            {saving ? "Creating…" : "Create Category"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
