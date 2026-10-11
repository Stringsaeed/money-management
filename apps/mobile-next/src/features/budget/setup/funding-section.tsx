import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY, type V2Account } from "@trove/api/v2/contracts";

import { spacing } from "@/ui/design-tokens";
import { Text } from "@/ui/text";
import { TextField } from "@/ui/text-field";
import { formatMoneyMinor } from "@/utils/money";

import { ChoiceRow } from "./choice-row";
import { fundingEligibleAccounts, isFundingTicked } from "./setup-plan";
import type { SetupDraft } from "./setup-types";

interface FundingSectionProps {
  readonly accounts: readonly V2Account[];
  readonly draft: Pick<SetupDraft, "funding" | "openingCash">;
  readonly totalInvalid: boolean;
  readonly onTick: (accountId: string, ticked: boolean) => void;
  readonly onTotal: (text: string) => void;
}

const unavailableNote = (account: V2Account): string | undefined => {
  if (account.currency !== BUDGET_CURRENCY) return "AED budgets only for now";
  if (account.type === "credit_card") {
    return "Card spending comes out of your envelopes, so cards are not counted as money you have.";
  }
  return undefined;
};

/** "Money you have right now": tick the accounts that hold it, or type one total when none can. */
export function FundingSection({
  accounts,
  draft,
  totalInvalid,
  onTick,
  onTotal,
}: FundingSectionProps) {
  const shown = accounts.filter((account) => !account.archived);
  const eligible = fundingEligibleAccounts(shown);

  return (
    <View style={styles.group}>
      <Text variant="title">Money you have right now</Text>
      {shown.map((account) => {
        const note = unavailableNote(account);
        const ticked = !note && isFundingTicked(account, draft.funding);
        return (
          <ChoiceRow
            key={account.id}
            label={account.name}
            note={note}
            detail={formatMoneyMinor(account.balanceMinor, account.currency)}
            ticked={ticked}
            disabled={Boolean(note)}
            onPress={() => onTick(account.id, !ticked)}
          />
        );
      })}
      {eligible.length === 0 ? (
        <TextField
          label="How much do you have right now?"
          placeholder={`${BUDGET_CURRENCY} 0`}
          keyboardType="decimal-pad"
          value={draft.openingCash}
          onChangeText={onTotal}
          error={totalInvalid ? "Enter an amount like 2500 or 2500.50." : undefined}
        />
      ) : null}
      {eligible.length === 0 ? (
        <Text variant="caption">
          This creates one My money cash account with that balance when you start your budget.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing[3] },
});
