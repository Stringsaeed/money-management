import { View } from "react-native";

import { ENABLE_SYNC_MATCHED_DESCRIPTION } from "@/components/household/enable-sync-copy";
import { Card } from "@/components/settings/card";
import { Text } from "@/components/ui/text";

export function SyncStatusCard() {
  return (
    <Card>
      <View className="gap-1 px-4 py-4">
        <Text className="font-body-semibold text-sm text-sage">☁️ Synced to the cloud</Text>
        <Text className="font-body-normal text-xs text-ink/40">
          {ENABLE_SYNC_MATCHED_DESCRIPTION}
        </Text>
      </View>
    </Card>
  );
}
