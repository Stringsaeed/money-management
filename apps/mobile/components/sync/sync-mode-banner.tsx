import { View } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import { useSyncModeStore } from "@/stores/sync-mode-store";

/**
 * Persistent mode indicator (#99): while the app is in local-only mode —
 * remote kill switch engaged or delta pulls unavailable for 10+ minutes —
 * an amber banner makes the state unmistakable. In normal synced mode the
 * banner is absent; the ledger simply looks and behaves as usual.
 */
export function SyncModeBanner() {
  const mode = useSyncModeStore((state) => state.mode);
  const reason = useSyncModeStore((state) => state.reason);

  if (mode !== "local_only") {
    return null;
  }

  const killSwitch = reason === "kill_switch";

  return (
    <View className="pointer-events-box-none absolute inset-x-4 bottom-safe-offset-2 z-50">
      <Animated.View
        className="rounded-xl border border-ledger-outline bg-surface-dim px-4 py-3"
        entering={FadeInDown.duration(220)}
        exiting={FadeOutUp.duration(180)}
        accessibilityLiveRegion="polite"
      >
        <View className="flex-row items-start gap-3">
          <Text className="text-lg">📴</Text>
          <View className="flex-1 gap-0.5">
            <Text className="font-body-semibold text-sm text-ink">Local-only mode</Text>
            <Text className="font-body-normal text-xs leading-5 text-ink/55">
              {killSwitch
                ? "Sync was paused remotely. Changes are saved on this device only."
                : "Can't reach the server right now. Changes are saved on this device only."}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
