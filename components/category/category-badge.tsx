import { View } from "react-native";
import { Text } from "@/components/ui/text";

interface CategoryBadgeProps {
  name: string;
  color: string;
  size?: "sm" | "md";
}

export function CategoryBadge({ name, color, size = "md" }: CategoryBadgeProps) {
  const isSmall = size === "sm";
  return (
    <View
      style={{ backgroundColor: `${color}20` }}
      className={`flex-row items-center rounded-full ${isSmall ? "gap-1 px-2 py-0.5" : "gap-1.5 px-2.5 py-1"}`}
    >
      <View
        style={{ backgroundColor: color }}
        className={`rounded-full ${isSmall ? "w-1.5 h-1.5" : "w-2 h-2"}`}
      />
      <Text style={{ color }} className={`font-medium ${isSmall ? "text-[11px]" : "text-[13px]"}`}>
        {name}
      </Text>
    </View>
  );
}
