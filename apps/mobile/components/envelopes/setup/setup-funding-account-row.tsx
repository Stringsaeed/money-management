import { Pressable } from "react-native";

import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { SetupDraftFundingAccount } from "@/modules/budgeting/budgeting";
import { formatCents } from "@/utils/currency";

interface SetupFundingAccountRowProps {
  account: SetupDraftFundingAccount;
  selected: boolean;
  onToggle: (accountId: string) => void;
}

export const SetupFundingAccountRow = ({
  account,
  selected,
  onToggle,
}: SetupFundingAccountRowProps) => {
  const handlePress = () => onToggle(account.id);
  return (
    <Pressable
      accessibilityLabel={`${selected ? "Remove" : "Add"} ${account.name} Funding Account`}
      aria-pressed={selected}
      className={cn(
        "flex-row items-center gap-3 rounded-xl border p-3",
        selected ? "border-sage bg-sage/10" : "border-ledger-outline bg-surface",
      )}
      onPress={handlePress}
      role="button"
    >
      <Text className="text-lg">{account.icon}</Text>
      <Text className="flex-1 font-body-medium text-sm text-ink">{account.name}</Text>
      <Text selectable className="font-body-normal text-sm text-ink/60">
        {formatCents(account.balanceMinor, account.currency)}
      </Text>
    </Pressable>
  );
};
