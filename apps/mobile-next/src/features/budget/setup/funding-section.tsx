import { StyleSheet, View } from "react-native";

import { BUDGET_CURRENCY, type V2Account } from "@trove/api/v2/contracts";

import { Amount, ListGroup, space, Text, TextField } from "@/ui/trove";

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
      <Text variant="titleMd">Money you have right now</Text>
      {shown.length > 0 ? (
        <ListGroup dividerInset={0}>
          {shown.map((account) => {
            const note = unavailableNote(account);
            const ticked = !note && isFundingTicked(account, draft.funding);
            return (
              <ChoiceRow
                key={account.id}
                label={account.name}
                note={note}
                trailing={
                  <Amount
                    currency={account.currency}
                    minor={account.balanceMinor}
                    tone="secondary"
                  />
                }
                ticked={ticked}
                disabled={Boolean(note)}
                onPress={() => onTick(account.id, !ticked)}
              />
            );
          })}
        </ListGroup>
      ) : null}
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
        <Text tone="secondary" variant="bodySm">
          This creates one My money cash account with that balance when you start your budget.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: space[3] },
});
