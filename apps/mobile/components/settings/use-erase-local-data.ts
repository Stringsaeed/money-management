import { useQueryClient } from "@tanstack/react-query";

import { useDatabase } from "@/db/client";
import {
  accounts as accountsTable,
  categories,
  exchangeRates,
  recurringOccurrences,
  recurringRules,
  transactions,
} from "@/db/schema";
import { clearSeedVersion } from "@/db/seed";
import { cohereLedgerCache } from "@/modules/ledger-cache";
import { useLedgerSourceSelection } from "@/modules/ledger-data-source/provider";

export const SYNCED_ERASE_REASON =
  "This device is synced to your household; the ledger lives on the server. Disable sync to erase local data.";

export type EraseLocalData =
  | { kind: "available"; run: () => Promise<void> }
  | { kind: "unavailable"; reason: string };

export function useEraseLocalData(): EraseLocalData {
  const selection = useLedgerSourceSelection();
  const db = useDatabase();
  const queryClient = useQueryClient();

  if (selection.kind === "synced") {
    return { kind: "unavailable", reason: SYNCED_ERASE_REASON };
  }

  return {
    kind: "available",
    run: async () => {
      await db.delete(recurringOccurrences);
      await db.delete(transactions);
      await db.delete(recurringRules);
      await db.delete(categories);
      await db.delete(exchangeRates);
      await db.delete(accountsTable);
      await clearSeedVersion(db);
      await cohereLedgerCache(queryClient, { kind: "ledger.reset" });
    },
  };
}
