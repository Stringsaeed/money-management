import { createContext, use, useRef, type PropsWithChildren } from "react";
import type { SQLiteDatabase } from "@/db/sqlite";
import { useSQLiteContext } from "@/db/sqlite";
import { useLedgerSourceSelection } from "@/modules/ledger-data-source/provider";
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

export function RecurringRulesProvider({ children }: PropsWithChildren) {
  const database = useSQLiteContext();
  const selection = useLedgerSourceSelection();
  const ledger = useSyncedTransactionLedger();
  const binding = useRef<RecurringRulesBinding | null>(null);
  const identity = selection.kind === "synced" ? ledger : database;
  if (identity && binding.current?.identity !== identity) {
    binding.current = {
      identity,
      module:
        selection.kind === "synced" && ledger
          ? createSyncedRecurringRules({
              collections: ledger.collections,
              binding: selection.ledger,
              userId: selection.userId,
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
