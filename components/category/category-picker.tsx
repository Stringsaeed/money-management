import { Pressable, Text, View } from "react-native";

import { useCategories } from "@/hooks/use-categories";

interface CategoryPickerProps {
  value: string | null;
  onChange: (categoryId: string | null) => void;
  type: "income" | "expense";
  label?: string;
}

export function CategoryPicker({ value, onChange, type, label }: CategoryPickerProps) {
  const { data: cats = [] } = useCategories(type);

  return (
    <View>
      {label ? (
        <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#374151" }}>
          {label}
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {cats.map((cat) => {
          const isSelected = cat.id === value;
          return (
            <Pressable
              key={cat.id}
              onPress={() => onChange(isSelected ? null : cat.id)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 2,
                borderColor: isSelected ? cat.color : "#E5E7EB",
                backgroundColor: isSelected ? `${cat.color}20` : "#F9FAFB",
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: cat.color,
                }}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: isSelected ? "600" : "400",
                  color: isSelected ? cat.color : "#374151",
                }}
              >
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
