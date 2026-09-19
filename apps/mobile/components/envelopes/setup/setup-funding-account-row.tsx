import { Pressable } from "react-native";

import { styles } from "@/components/envelopes/styles";
import { Text } from "@/components/ui/text";
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
      onPress={handlePress}
      role="button"
      style={[
        styles.fundingRowBase,
        selected ? styles.fundingRowSelected : styles.fundingRowUnselected,
      ]}
    >
      <Text style={styles.fundingIcon}>{account.icon}</Text>
      <Text style={[styles.textMediumInkSm, styles.flex1]}>{account.name}</Text>
      <Text selectable style={styles.fundingBalance}>
        {formatCents(account.balanceMinor, account.currency)}
      </Text>
    </Pressable>
  );
};
