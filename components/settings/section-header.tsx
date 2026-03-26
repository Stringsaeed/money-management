import { View } from "react-native";

import { Text } from "@/components/ui/text";

export function SectionHeader({ title }: { title: string }) {
  return (
    <View className="flex-row items-center pt-8 pb-3 border-b border-ledger-outline mx-5">
      <Text className="font-heading-normal text-xl italic text-ink">{title}</Text>
    </View>
  );
}
