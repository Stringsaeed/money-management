import type { V2EnvelopeRepeat } from "@trove/api/v2/contracts";

/** Budgeting analytics events. Payloads carry counts, flags, and closed string unions only (a string type could be fed a name or id): never amounts, payees, notes, or account names. */
export interface AnalyticsEvents {
  budget_setup_started: Record<string, never>;
  budget_setup_step_completed: { step: "payday" | "items" | "amounts" };
  budget_activated: { envelope_count: number; groups: number; currency_count: number };
  budget_home_viewed: Record<string, never>;
  spend_quick_added: { has_account: boolean; has_note: boolean; backdated: boolean };
  overspend_covered: { source_type: "unassigned" | "everyday" | "bills" | "saving" };
  money_moved: Record<string, never>;
  reminder_shown: { type: "payday" | "due" };
  bill_marked_paid: Record<string, never>;
  bill_skipped: Record<string, never>;
  got_paid_logged: { timing: "early" | "on_time" | "late" };
  month_wrapup_completed: { skipped: boolean };
  plan_repeated: Record<string, never>;
  big_payment_created: { repeat: V2EnvelopeRepeat };
  ledger_switched: { to: "personal" | "household" };
}

export type AnalyticsEventName = keyof AnalyticsEvents;
