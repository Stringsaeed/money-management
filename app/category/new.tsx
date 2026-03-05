import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View
} from "react-native";
import { Text } from "@/components/ui/text";

import { ColorPicker } from "@/components/common/color-picker";
import { ColorPalette } from "@/constants/theme";
import { useCreateCategory } from "@/hooks/use-categories";

export default function NewCategoryScreen() {
  const createCategory = useCreateCategory();
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [color, setColor] = useState(ColorPalette[0]);
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
        icon: "tag.fill",
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
            Category Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Groceries"
            autoFocus
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
            Type
          </Text>
          <View
            style={{
              flexDirection: "row",
              borderRadius: 10,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <Pressable
              onPress={() => setType("expense")}
              style={{
                flex: 1,
                paddingVertical: 12,
                alignItems: "center",
                backgroundColor: type === "expense" ? "#DC2626" : "white",
              }}
            >
              <Text style={{ fontWeight: "600", color: type === "expense" ? "white" : "#374151" }}>
                Expense
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setType("income")}
              style={{
                flex: 1,
                paddingVertical: 12,
                alignItems: "center",
                backgroundColor: type === "income" ? "#16A34A" : "white",
              }}
            >
              <Text style={{ fontWeight: "600", color: type === "income" ? "white" : "#374151" }}>
                Income
              </Text>
            </Pressable>
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
            {saving ? "Creating…" : "Create Category"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
