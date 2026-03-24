import { TextInput, useColorScheme, View } from "react-native";

import { Text } from "@/components/ui/text";

interface NoteInputProps {
  value: string;
  onChange: (text: string) => void;
}

export function NoteInput({ value, onChange }: NoteInputProps) {
  const colorScheme = useColorScheme();
  const placeholderColor = colorScheme === "dark" ? "#E8E6E340" : "#1C1B1A40";

  return (
    <View className="px-5 py-2">
      <View className="flex-row items-center gap-2 bg-surface-container rounded-xl px-4 py-2.5">
        <Text className="text-base">📝</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Add a note..."
          placeholderTextColor={placeholderColor}
          className="flex-1 font-body-normal text-[15px] text-ink py-0"
        />
      </View>
    </View>
  );
}
