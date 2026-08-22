import { Pressable } from "react-native";
import { ArrowClockwiseIcon } from "phosphor-react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

interface RefreshMarketButtonProps {
  disabled: boolean;
  onPress: () => void;
}

export function RefreshMarketButton({ disabled, onPress }: RefreshMarketButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      className="flex-row items-center gap-2 rounded-full border border-ledger-outline px-3 py-2 active:bg-surface-dim disabled:opacity-40"
    >
      <Icon as={ArrowClockwiseIcon} className="text-ink/50" size={14} />
      <Text className="font-body-semibold text-xs text-ink/50">Refresh</Text>
    </Pressable>
  );
}
