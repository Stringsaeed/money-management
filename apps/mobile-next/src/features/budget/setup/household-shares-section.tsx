import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY } from "@trove/api/v2/contracts";

import type { HouseholdDetail } from "@/features/household/household-client";
import { spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
import { TextField } from "@/ui/text-field";

interface HouseholdSharesSectionProps {
  readonly household: HouseholdDetail | null;
  readonly shares: Readonly<Record<string, string>>;
  readonly onChange: (userId: string, text: string) => void;
}

/**
 * H2: what each member expects to put in each month. Informational: it is kept with the draft on
 * this device and never changes the plan or the numbers.
 */
export function HouseholdSharesSection({
  household,
  shares,
  onChange,
}: HouseholdSharesSectionProps) {
  const members = household?.members.filter((member) => member.status === "active") ?? [];
  return (
    <View style={styles.group}>
      <Text variant="title">Monthly share per member</Text>
      <Text variant="caption">
        For your own reference. Nothing here changes your plan. In your Personal budget this shows
        as a Bill: Household share.
      </Text>
      {members.map((member) => (
        <TextField
          key={member.userId}
          label={member.userName || member.userEmail}
          placeholder={`${BUDGET_CURRENCY} 0`}
          keyboardType="decimal-pad"
          value={shares[member.userId] ?? ""}
          onChangeText={(text) => onChange(member.userId, text)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ group: { gap: spacing[3] } });
