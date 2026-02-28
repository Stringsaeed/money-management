import { Pressable, ScrollView, View } from "react-native";

import { ColorPalette } from "@/constants/theme";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: "row", gap: 10, paddingVertical: 4 }}>
        {ColorPalette.map((c) => (
          <Pressable
            key={c}
            onPress={() => onChange(c)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: c,
              borderWidth: value === c ? 3 : 1,
              borderColor: value === c ? "#fff" : "transparent",
              shadowColor: "#000",
              shadowOpacity: value === c ? 0.4 : 0,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 2 },
              elevation: value === c ? 4 : 0,
            }}
          />
        ))}
      </View>
    </ScrollView>
  );
}
