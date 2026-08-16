import { createContext, use, useState, type PropsWithChildren } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { generateId } from "@/utils/id";

import { createSystemClock } from "./clock";
import { createRecurringRules } from "./recurring-rules";
import type { RecurringRules } from "./types";

const RecurringRulesContext = createContext<RecurringRules | null>(null);

export function RecurringRulesProvider({ children }: PropsWithChildren) {
  const database = useSQLiteContext();
  const [recurringRules] = useState(() =>
    createRecurringRules({
      database,
      clock: createSystemClock(),
      identity: { next: () => generateId() },
    }),
  );

  return <RecurringRulesContext value={recurringRules}>{children}</RecurringRulesContext>;
}

export function useRecurringRulesModule(): RecurringRules {
  const recurringRules = use(RecurringRulesContext);
  if (!recurringRules) {
    throw new Error("useRecurringRulesModule must be used inside RecurringRulesProvider.");
  }
  return recurringRules;
}
