import { createContext, use, useRef, type PropsWithChildren } from "react";
import type { SQLiteDatabase } from "expo-sqlite";
import { useSQLiteContext } from "expo-sqlite";

import { generateId } from "@/utils/id";

import { createSystemClock } from "./clock";
import { createRecurringRules } from "./recurring-rules";
import type { RecurringRules } from "./types";

const RecurringRulesContext = createContext<RecurringRules | null>(null);

interface RecurringRulesBinding {
  database: SQLiteDatabase;
  module: RecurringRules;
}

export function RecurringRulesProvider({ children }: PropsWithChildren) {
  const database = useSQLiteContext();
  const binding = useRef<RecurringRulesBinding | null>(null);
  if (binding.current?.database !== database) {
    binding.current = {
      database,
      module: createRecurringRules({
        database,
        clock: createSystemClock(),
        identity: { next: () => generateId() },
      }),
    };
  }

  return <RecurringRulesContext value={binding.current.module}>{children}</RecurringRulesContext>;
}

export function useRecurringRulesModule(): RecurringRules {
  const recurringRules = use(RecurringRulesContext);
  if (!recurringRules) {
    throw new Error("useRecurringRulesModule must be used inside RecurringRulesProvider.");
  }
  return recurringRules;
}
