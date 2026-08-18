import { Pressable } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { layoutTransition } from "@/components/transaction/constants";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

interface WorkspaceOptionProps {
  currency: string;
  disabled: boolean;
  selected: boolean;
  onSelect: (request: { currency: string }) => void;
}

export const WorkspaceOption = ({
  currency,
  disabled,
  selected,
  onSelect,
}: WorkspaceOptionProps) => {
  const handlePress = () => {
    if (!selected) onSelect({ currency });
  };

  return (
    <Animated.View layout={layoutTransition}>
      <Pressable
        accessibilityLabel={`${currency} currency workspace`}
        accessibilityRole="radio"
        accessibilityState={{ disabled, selected }}
        className={cn(
          "min-h-14 flex-row items-center justify-between rounded-xl border px-4 py-3 active:bg-surface-dim",
          selected ? "border-ink bg-surface-container" : "border-ledger-outline bg-surface",
        )}
        disabled={disabled}
        onPress={handlePress}
      >
        <Text className="font-body-semibold text-base text-ink">{currency}</Text>
        {selected ? (
          <Animated.View entering={FadeIn} exiting={FadeOut} layout={layoutTransition}>
            <Text className="font-body-medium text-xs text-ink">Selected ✓</Text>
          </Animated.View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
};
