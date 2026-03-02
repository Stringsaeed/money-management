import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, { Easing, LinearTransition } from "react-native-reanimated";

import { useCategories } from "@/hooks/use-categories";

interface CategoryChipProps {
  name: string;
  color: string;
  isSelected: boolean;
  onPress: () => void;
}

function CategoryChip({ name, color, isSelected, onPress }: CategoryChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderColor: isSelected ? color : "#E5E7EB",
        backgroundColor: isSelected ? `${color}20` : "#F9FAFB",
      }}
      className="flex-row items-center gap-1.5 px-3 py-2 rounded-full border-2"
    >
      <View style={{ backgroundColor: color }} className="w-2 h-2 rounded-full" />
      <Text
        style={{ color: isSelected ? color : undefined }}
        className={`text-[13px] ${isSelected ? "font-semibold" : "font-normal text-gray-700"}`}
      >
        {name}
      </Text>
    </Pressable>
  );
}

interface CategoryPickerProps {
  value: string | null;
  onChange: (categoryId: string | null) => void;
  type: "income" | "expense";
  label?: string;
}

export function CategoryPicker({ value, onChange, type, label }: CategoryPickerProps) {
  const { data: cats = [] } = useCategories(type);

  return (
    <View className="gap-2">
      {label ? <Text className="text-sm font-semibold text-gray-700">{label}</Text> : null}
      <Animated.View
        layout={LinearTransition.easing(Easing.ease)}
        className="flex-row flex-wrap gap-2"
      >
        {cats.map((cat) => (
          <CategoryChip
            key={cat.id}
            name={cat.name}
            color={cat.color}
            isSelected={cat.id === value}
            onPress={() => onChange(cat.id === value ? null : cat.id)}
          />
        ))}
      </Animated.View>
    </View>
  );
}
