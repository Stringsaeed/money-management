import { View } from "react-native";

import { Card } from "@/components/settings/card";
import { Text } from "@/components/ui/text";

export function SyncStatusCard() {
  return (
    <Card>
      <View className="gap-1 px-4 py-4">
        <Text className="font-body-semibold text-sm text-sage">☁️ Synced to the cloud</Text>
        <Text className="font-body-normal text-xs text-ink/40">
          Your budget backs up automatically and is ready to share.
        </Text>
      </View>
    </Card>
  );
}
