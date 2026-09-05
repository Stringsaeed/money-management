import { useRequiredLedger } from "./provider";
import type { TransactionIntents } from "./ledger";

export const useTransactionIntents = (): TransactionIntents => useRequiredLedger().intents;
