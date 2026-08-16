import { Pressable, View } from "react-native";
import { XIcon } from "phosphor-react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

export function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <View className="flex-row bg-accent items-center gap-1.5 border border-ledger-outline pl-3 pr-1.5 py-1.5 shadow-sm rounded-sm self-center">
      <Text className="font-body-medium text-xs text-ink/60 tracking-wide">{label}</Text>
      <Pressable
        onPress={onRemove}
        hitSlop={8}
        className="w-5 h-5 items-center justify-center rounded-full active:bg-ink/5"
      >
        <Icon as={XIcon} size={10} className="text-ink/60" />
      </Pressable>
    </View>
  );
}
