import { useQueryClient } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { useEffect, useRef } from "react";

import { useDatabase } from "@/db/client";
import { recurringPayments, transactions } from "@/db/schema";
import { generateId } from "@/utils/id";
import { nowIso, today } from "@/utils/date";
import { getPendingOccurrences } from "@/utils/recurring";
import type { RecurringPayment } from "@/types";

/**
 * Runs on app launch. Processes all active recurring payment rules and
 * generates any missing transaction entries up to today.
 *
 * Call this once at the root component level (inside SQLiteProvider).
 */
export function useRecurringProcessor() {
  const db = useDatabase();
  const qc = useQueryClient();
  // Use refs so the effect can safely reference stable values without
  // re-running on every render (this is intentionally run once on mount)
  const dbRef = useRef(db);
  const qcRef = useRef(qc);
  dbRef.current = db;
  qcRef.current = qc;

  useEffect(() => {
    let cancelled = false;

    async function process() {
      const db = dbRef.current;
      const qc = qcRef.current;
      try {
        const todayStr = today();

        // Load all active recurring rules
        const rules = (await db
          .select()
          .from(recurringPayments)
          .where(eq(recurringPayments.isActive, true))
          .all()) as RecurringPayment[];

        if (rules.length === 0 || cancelled) return;

        let anyGenerated = false;

        for (const rule of rules) {
          if (cancelled) break;

          const pendingDates = getPendingOccurrences(rule, todayStr);
          if (pendingDates.length === 0) continue;

          anyGenerated = true;
          const now = nowIso();

          for (const date of pendingDates) {
            if (cancelled) break;
            await db.insert(transactions).values({
              id: generateId(),
              type: rule.type,
              amount: rule.amount,
              currency: rule.currency,
              originalAmount: null,
              originalCurrency: null,
              exchangeRate: null,
              date,
              accountId: rule.accountId,
              toAccountId: rule.toAccountId,
              categoryId: rule.categoryId,
              recurringPaymentId: rule.id,
              description: rule.description || rule.name,
              createdAt: now,
              updatedAt: now,
            });
          }

          // Update lastGeneratedDate on the rule
          const lastDate = pendingDates[pendingDates.length - 1];
          await db
            .update(recurringPayments)
            .set({ lastGeneratedDate: lastDate, updatedAt: nowIso() })
            .where(eq(recurringPayments.id, rule.id));
        }

        if (anyGenerated && !cancelled) {
          qc.invalidateQueries({ queryKey: ["transactions"] });
          qc.invalidateQueries({ queryKey: ["account-balances"] });
          qc.invalidateQueries({ queryKey: ["month-summary"] });
          qc.invalidateQueries({ queryKey: ["recurring-payments"] });
        }
      } catch (err) {
        // Silent fail — will retry on next launch
        console.warn("[recurring-processor]", err);
      }
    }

    process();
    return () => {
      cancelled = true;
    };
  }, []); // runs once on mount
}
