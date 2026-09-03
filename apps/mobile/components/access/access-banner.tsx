import { View } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { layoutTransition } from "@/components/transaction/constants";
import { returnTo, useAccess } from "@/modules/access";

export function AccessBanner() {
  const access = useAccess();
  if (access.kind !== "session_revoked") return null;

  return (
    <View className="pointer-events-box-none absolute inset-x-4 top-safe-offset-2 z-50">
      <Animated.View
        className="rounded-xl border border-ledger-outline bg-surface-dim px-4 py-3"
        entering={FadeInDown.duration(220)}
        exiting={FadeOutUp.duration(180)}
        layout={layoutTransition}
      >
        <View className="flex-row items-start gap-3">
          <Text className="text-lg">🔐</Text>
          <View className="flex-1 gap-2">
            <Text className="font-body-semibold text-sm text-ink">
              Signed out remotely. Your ledger is safe on this device.
            </Text>
            <Button size="sm" onPress={() => access.reauthenticate(returnTo.current())}>
              <Text className="font-body-semibold text-white">Sign in again</Text>
            </Button>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
