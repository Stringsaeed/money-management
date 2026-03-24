import { Pressable, View } from "react-native";

import { ColorPalette } from "@/constants/theme";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <View className="flex-row flex-wrap gap-2.5 py-1">
      {ColorPalette.map((c) => (
        <Pressable
          key={c}
          onPress={() => onChange(c)}
          style={{ backgroundColor: c }}
          className={
            value === c
              ? "w-9 h-9 rounded-full border-[3px] border-background shadow"
              : "w-9 h-9 rounded-full"
          }
        />
      ))}
    </View>
  );
}
