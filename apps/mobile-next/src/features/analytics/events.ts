/** Budgeting analytics events. Payloads carry counts, flags, and enums only: never amounts, payees, notes, or account names. */
export interface AnalyticsEvents {
  budget_setup_started: Record<string, never>;
  budget_setup_step_completed: { step: string };
  budget_activated: { envelope_count: number; groups: number };
  budget_home_viewed: Record<string, never>;
  spend_quick_added: { has_account: boolean; has_note: boolean; backdated: boolean };
  overspend_covered: { source_type: string };
  money_moved: Record<string, never>;
  reminder_shown: { type: string };
  bill_marked_paid: Record<string, never>;
  bill_skipped: Record<string, never>;
  got_paid_logged: { timing: "early" | "on_time" | "late" };
  month_wrapup_completed: { skipped: boolean };
  plan_repeated: Record<string, never>;
  big_payment_created: { repeat: string };
  ledger_switched: { to: string };
}

export type AnalyticsEventName = keyof AnalyticsEvents;
