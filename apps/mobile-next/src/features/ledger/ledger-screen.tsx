import { useState } from "react";

import type { V2Transaction } from "@trove/api/v2/contracts";

import { Screen } from "@/ui/screen";

import { LedgerFilterSheet } from "./list/ledger-filter-sheet";
import { monthRange } from "./list/ledger-filters";
import type { LedgerVariant } from "./list/ledger-variant";
import { LedgerVariantSwitcher } from "./list/ledger-variant-switcher";
import { LEDGER_INSET } from "./list/ledger-transaction-list";
import { useLedgerList } from "./list/use-ledger-list";
import { AccountsVariant } from "./list/variants/accounts-variant";
import { JournalVariant } from "./list/variants/journal-variant";
import { MonthlyVariant } from "./list/variants/monthly-variant";
import { StatementVariant } from "./list/variants/statement-variant";
import { SummaryVariant } from "./list/variants/summary-variant";
import type { LedgerVariantProps } from "./list/variants/variant-props";

export interface LedgerScreenProps {
  readonly onAddTransaction?: () => void;
  readonly onOpenTransaction?: (transaction: V2Transaction) => void;
  readonly onOpenAccounts?: () => void;
  readonly onOpenCategories?: () => void;
  readonly onOpenRecurring?: () => void;
  /** Starting layout while the design is under review. */
  readonly initialVariant?: LedgerVariant;
}

const VARIANTS = {
  journal: JournalVariant,
  summary: SummaryVariant,
  accounts: AccountsVariant,
  statement: StatementVariant,
  monthly: MonthlyVariant,
} satisfies Record<LedgerVariant, (props: LedgerVariantProps) => React.ReactNode>;

export function LedgerScreen({
  onAddTransaction,
  onOpenTransaction,
  onOpenAccounts,
  onOpenCategories,
  onOpenRecurring,
  initialVariant = "journal",
}: LedgerScreenProps) {
  const list = useLedgerList();
  const [variant, setVariant] = useState<LedgerVariant>(initialVariant);
  const Variant = VARIANTS[variant];
  const chooseVariant = (next: LedgerVariant) => {
    setVariant(next);
    // Monthly is built around one month; open it on the current one.
    if (next === "monthly" && !list.filters.range)
      list.update((current) => ({ ...current, range: monthRange(new Date()) }));
  };

  return (
    <Screen edges={["top"]}>
      <Variant
        list={list}
        navigation={{ onAddTransaction, onOpenAccounts, onOpenCategories, onOpenRecurring }}
        onOpenTransaction={onOpenTransaction}
        switcher={
          __DEV__ ? (
            <LedgerVariantSwitcher value={variant} onChange={chooseVariant} inset={LEDGER_INSET} />
          ) : null
        }
      />
      <LedgerFilterSheet list={list} />
    </Screen>
  );
}
