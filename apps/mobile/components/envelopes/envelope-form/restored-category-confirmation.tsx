import { Pressable } from "react-native";

import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { EnvelopeCategoryOption } from "@/modules/budgeting/budgeting";

interface RestoredCategoryConfirmationProps {
  checked: boolean;
  onChange: (categoryId: string, checked: boolean) => void;
  option: EnvelopeCategoryOption;
}

export function RestoredCategoryConfirmation({
  checked,
  onChange,
  option,
}: RestoredCategoryConfirmationProps) {
  return (
    <Pressable
      accessibilityLabel={`Confirm future Mapping for ${option.name}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      className={cn(
        "min-h-14 gap-1 rounded-xl border border-ledger-outline bg-surface px-3 py-2 active:bg-surface-dim",
        checked && "border-ink bg-surface-container",
      )}
      onPress={() => onChange(option.id, !checked)}
    >
      <Text className="font-body-medium text-sm text-ink">
        {checked ? "Future Mapping confirmed ✓" : `Confirm ${option.name}`}
      </Text>
      <Text className="font-body-normal text-xs text-ink/60">
        Restoration does not recreate future mappings automatically.
      </Text>
    </Pressable>
  );
}
