import { useLedgerMutations } from "@/data/ledger-queries";

import { withMutationCues } from "./mutation-cues";

/** Ledger mutations that give audible feedback when they finish. */
export const useLedgerMutationsWithSound = () => withMutationCues(useLedgerMutations());
