import { StyleSheet, View } from "react-native";

import type { V2Account } from "@trove/api/v2/contracts";

import { space, Text, TextField } from "@/ui/trove";

import { FundingRow } from "./funding-row";
import { SectionStamp } from "./section-stamp";
import { fundingRows, needsTypedTotal } from "./setup-accounts";
import type { SetupDraft } from "./setup-types";

interface FundingSectionProps {
  /** "MONEY YOU HAVE RIGHT NOW", or the household's "SHARED MONEY IT BUDGETS FROM". */
  readonly title: string;
  /** The budget's currency: accounts in any other currency are not part of it. */
  readonly currency: string;
  readonly accounts: readonly V2Account[];
  readonly draft: Pick<SetupDraft, "funding" | "openingCash">;
  /** S2 notes each account's type; the household board prints names alone. */
  readonly showType: boolean;
  readonly totalInvalid: boolean;
  /** Nothing ticked: say what Next is waiting for. */
  readonly needsAccount: boolean;
  /** Accounts are still loading: the typed-total field would flash and then vanish. */
  readonly loading: boolean;
  readonly onTick: (accountId: string, ticked: boolean) => void;
  readonly onTotal: (text: string) => void;
}

/** The accounts that hold the money to plan, or one typed total when none can. */
export function FundingSection({
  title,
  currency,
  accounts,
  draft,
  showType,
  totalInvalid,
  needsAccount,
  loading,
  onTick,
  onTotal,
}: FundingSectionProps) {
  const rows = fundingRows(accounts, draft, currency, showType);
  const typeTotal = !loading && needsTypedTotal(accounts, currency);

  return (
    <View style={styles.section}>
      <View style={styles.stamp}>
        <SectionStamp label={title} />
      </View>
      {rows.map((row) => (
        <FundingRow key={row.id} row={row} onToggle={onTick} />
      ))}
      {loading ? (
        <Text tone="secondary" variant="bodySm">
          Loading your accounts…
        </Text>
      ) : null}
      {needsAccount && !typeTotal ? (
        <Text tone="secondary" variant="bodySm">
          Tick at least one account that holds your money.
        </Text>
      ) : null}
      {typeTotal ? (
        <View style={styles.total}>
          <TextField
            label="How much do you have right now?"
            placeholder={`${currency} 0`}
            keyboardType="decimal-pad"
            value={draft.openingCash}
            onChangeText={onTotal}
            error={totalInvalid ? "Enter an amount like 2500 or 2500.50." : undefined}
          />
          <Text tone="secondary" variant="bodySm">
            This creates one My money cash account with that balance when you start your budget.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space[1] },
  stamp: { marginBottom: space[1] },
  total: { gap: space[3], paddingTop: space[2] },
});
