import { createContext, use, useRef, type PropsWithChildren } from "react";
import type { SQLiteDatabase } from "@/db/sqlite";
import { useSQLiteContext } from "@/db/sqlite";
import {
  useLedgerSourceSelection,
  type LedgerSourceSelection,
} from "@/modules/ledger-data-source/provider";
import { useSyncedTransactionLedger } from "@/modules/ledger-db/provider";

import { generateId } from "@/utils/id";

import { createSystemClock } from "./clock";
import { createRecurringRules } from "./recurring-rules";
import { createSyncedRecurringRules } from "./synced";
import type { RecurringRules } from "./types";

const RecurringRulesContext = createContext<RecurringRules | null>(null);

interface RecurringRulesBinding {
  identity: SQLiteDatabase | object;
  module: RecurringRules;
}

interface RecurringHousehold {
  readonly householdId: string;
  readonly userId: string;
}

/**
 * Recurring rules are Household-owned (#227 moves them onto the Ledger), so a
 * Personal Ledger resolves to no Household and keeps the on-device module.
 */
const recurringHousehold = (selection: LedgerSourceSelection): RecurringHousehold | null => {
  if (selection.kind !== "synced") return null;
  const { householdId } = selection.ledger;
  return householdId === null ? null : { householdId, userId: selection.userId };
};

export function RecurringRulesProvider({ children }: PropsWithChildren) {
  const database = useSQLiteContext();
  const selection = useLedgerSourceSelection();
  const ledger = useSyncedTransactionLedger();
  const binding = useRef<RecurringRulesBinding | null>(null);
  const household = recurringHousehold(selection);
  const identity = household ? ledger : database;
  if (identity && binding.current?.identity !== identity) {
    binding.current = {
      identity,
      module:
        household && ledger
          ? createSyncedRecurringRules({
              collections: ledger.collections,
              householdId: household.householdId,
              userId: household.userId,
              clock: createSystemClock(),
              nextId: generateId,
            })
          : createRecurringRules({
              database,
              clock: createSystemClock(),
              identity: { next: () => generateId() },
            }),
    };
  }

  return (
    <RecurringRulesContext value={binding.current?.module ?? null}>
      {children}
    </RecurringRulesContext>
  );
}

export function useRecurringRulesModule(): RecurringRules {
  const recurringRules = use(RecurringRulesContext);
  if (!recurringRules) {
    throw new Error("useRecurringRulesModule must be used inside RecurringRulesProvider.");
  }
  return recurringRules;
}
