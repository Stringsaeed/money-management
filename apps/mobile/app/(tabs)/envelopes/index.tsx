import { View } from "react-native";

import { EmptyState } from "@/components/common/empty-state";
import { SeedPacketsGraphic } from "@/components/graphics/seed-packets";

export default function EnvelopesScreen() {
  return (
    <View className="flex-1 bg-background">
      <EmptyState
        illustration={<SeedPacketsGraphic />}
        title="Envelopes"
        message="Budget envelopes are coming soon. Set aside money for what matters and watch each envelope grow."
      />
    </View>
  );
}
