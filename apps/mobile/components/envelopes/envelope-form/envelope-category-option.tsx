import { Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { EnvelopeCategoryOption } from "@/modules/budgeting/budgeting";

interface EnvelopeCategoryOptionProps {
  checked: boolean;
  option: EnvelopeCategoryOption;
  onChange: (categoryId: string, checked: boolean) => void;
  scheduledFromPeriod?: string;
}

export function EnvelopeCategoryOptionRow({
  checked,
  option,
  onChange,
  scheduledFromPeriod,
}: EnvelopeCategoryOptionProps) {
  const disabled = !option.eligible && !checked;
  return (
    <Pressable
      accessibilityLabel={`${option.name} Category`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      className={cn(
        "min-h-14 flex-row items-center gap-3 rounded-xl border border-ledger-outline bg-surface px-3 py-2 active:bg-surface-dim",
        checked && "border-ink bg-surface-container",
        disabled && "opacity-50",
      )}
      disabled={disabled}
      onPress={() => onChange(option.id, !checked)}
    >
      <Text className="text-lg">{option.icon}</Text>
      <View className="min-w-0 flex-1">
        <Text className="font-body-medium text-sm text-ink">{option.name}</Text>
        {option.ineligibilityReason === "incompatible-currency" ? (
          <Text className="font-body-normal text-xs text-destructive">
            Used by another currency
          </Text>
        ) : scheduledFromPeriod ? (
          <Text className="font-body-normal text-xs text-ink/50">
            Scheduled from {scheduledFromPeriod}
          </Text>
        ) : option.mappedEnvelopeId ? (
          <Text className="font-body-normal text-xs text-ink/50">Currently mapped</Text>
        ) : null}
      </View>
      <Text className="font-body-semibold text-sm text-ink">{checked ? "Selected ✓" : "Add"}</Text>
    </Pressable>
  );
}
