import { Pressable, ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, { Easing, LinearTransition } from "react-native-reanimated";

import { useCategories } from "@/hooks/use-categories";
import { cn } from "@/lib/utils";

interface CategoryChipProps {
  name: string;
  color: string;
  isSelected: boolean;
  onPress: () => void;
}

function CategoryChip({ name, color, isSelected, onPress }: CategoryChipProps) {
  return (
    <Pressable
      aria-label={name}
      aria-selected={isSelected}
      onPress={onPress}
      style={{
        borderColor: isSelected ? color : undefined,
        backgroundColor: isSelected ? `${color}20` : undefined,
      }}
      className={cn(
        "flex-row items-center gap-1.5 rounded-full border-2 px-3 py-2",
        !isSelected && "border-input bg-card",
      )}
      role="button"
    >
      <View style={{ backgroundColor: color }} className="w-2 h-2 rounded-full" />
      <Text
        style={{ color: isSelected ? color : undefined }}
        className={cn("text-sm", isSelected ? "font-semibold" : "font-normal text-foreground")}
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
  const { data: categories = [] } = useCategories(type);
  const cats = categories.filter((category) => category.lifecycle === "active");

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
