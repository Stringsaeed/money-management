import { Pressable, ScrollView, View } from "react-native";
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
        borderColor: isSelected ? color : undefined,
        backgroundColor: isSelected ? `${color}20` : undefined,
      }}
      className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border-2 ${isSelected ? "" : "border-input bg-card"}`}
    >
      <View style={{ backgroundColor: color }} className="w-2 h-2 rounded-full" />
      <Text
        style={{ color: isSelected ? color : undefined }}
        className={`text-[13px] ${isSelected ? "font-semibold" : "font-normal text-foreground"}`}
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
  horizontal?: boolean;
}

export function CategoryPicker({
  value,
  onChange,
  type,
  label,
  horizontal = false,
}: CategoryPickerProps) {
  const { data: cats = [] } = useCategories(type);

  if (horizontal) {
    return (
      <View className="gap-2">
        {label ? <Text className="text-sm font-semibold text-foreground">{label}</Text> : null}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
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
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="gap-2">
      {label ? <Text className="text-sm font-semibold text-foreground">{label}</Text> : null}
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
