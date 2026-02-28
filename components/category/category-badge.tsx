import { Text, View } from "react-native";

interface CategoryBadgeProps {
  name: string;
  color: string;
  icon?: string;
  size?: "sm" | "md";
}

export function CategoryBadge({ name, color, icon, size = "md" }: CategoryBadgeProps) {
  const isSmall = size === "sm";
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: isSmall ? 4 : 6,
        backgroundColor: `${color}20`,
        paddingHorizontal: isSmall ? 8 : 10,
        paddingVertical: isSmall ? 3 : 5,
        borderRadius: 20,
      }}
    >
      <View
        style={{
          width: isSmall ? 6 : 8,
          height: isSmall ? 6 : 8,
          borderRadius: isSmall ? 3 : 4,
          backgroundColor: color,
        }}
      />
      <Text
        style={{
          fontSize: isSmall ? 11 : 13,
          fontWeight: "500",
          color: color,
        }}
      >
        {name}
      </Text>
    </View>
  );
}
