import { View } from "react-native";

import { Text } from "@/components/ui/text";

/** Empty inbox: nothing the server refused — a good place to be. */
export function RejectedChangesEmptyState() {
  return (
    <View className="items-center gap-2 rounded-2xl border border-dashed border-ledger-outline bg-surface-container/50 p-8">
      <Text className="text-4xl">🎉</Text>
      <Text className="font-heading-normal text-xl italic tracking-tight text-ink">
        Nothing rejected
      </Text>
      <Text className="text-center font-body-normal text-sm text-ink/50">
        Changes the server couldn&apos;t accept will show up here with the reason, so you can fix or
        discard them.
      </Text>
    </View>
  );
}
