import { router } from "expo-router";
import { Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";

export function JournalHeader() {
  return (
    <View className="mx-5 mt-4 flex-row items-center justify-between rounded-lg border border-ledger-outline bg-surface px-4 py-3 shadow-sm shadow-black/5">
      <Text className="font-heading-normal text-xl italic text-ink">Recent Journal</Text>
      <Pressable
        accessibilityLabel="View all recent transactions"
        accessibilityRole="button"
        className="px-1 py-1 active:opacity-50"
        onPress={() => router.push("/ledger")}
      >
        <Text className="font-body-semibold text-xs text-ink/50">View all</Text>
      </Pressable>
    </View>
  );
}
