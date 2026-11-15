import type { V2TransactionSummary } from "@trove/api/v2/contracts";

/**
 * Last month's plan, as Repeat needs it: there is none (first period), it is on its way, it
 * could not be read, or here it is.
 */
export type LastMonth = "none" | "loading" | "error" | "ready";

/**
 * Whether C3 shows Repeat: not without a last month or while the role loads, refused (with the
 * admin-only line) for anyone who can't edit the plan, offered otherwise.
 */
export type RepeatAccess = "hidden" | "refused" | "offered";

/** Whether this person can change plan amounts here: unknown while a household role loads. */
export type PlanAccess = "loading" | "refused" | "allowed";

/** Where last month's plan stands: no period to read, read, failed, or on its way. */
export function lastMonthOf(hasPrevious: boolean, loaded: boolean, failed: boolean): LastMonth {
  if (!hasPrevious) return "none";
  if (loaded) return "ready";
  return failed ? "error" : "loading";
}

/** Plan access from the caller's budget role, unknown while it loads. */
export function planAccessOf(roleLoading: boolean, canEditPlan: boolean): PlanAccess {
  if (roleLoading) return "loading";
  return canEditPlan ? "allowed" : "refused";
}

/** Repeat needs a last month and a known role; it is refused to anyone who can't edit the plan. */
export function repeatAccessOf(lastMonth: LastMonth, access: PlanAccess): RepeatAccess {
  if (lastMonth === "none" || access === "loading") return "hidden";
  return access === "allowed" ? "offered" : "refused";
}

/** Income in the budget's currency from a transaction summary; `null` while unknown or failed. */
export function periodIncome(
  summary: V2TransactionSummary | undefined,
  failed: boolean,
  currency: string,
): number | null {
  if (!summary || failed) return null;
  return summary.totals.find((total) => total.currency === currency)?.incomeMinor ?? 0;
}

export interface MoneyToPlan {
  /** Income into the budget's accounts since the period began. */
  readonly incomeMinor: number;
  /** Everything else the budget holds that no plan has taken: mostly last month's unplanned money. */
  readonly carriedMinor: number;
  /** Net of this period's assignments so far (plans, repeats, covers, moves, leftovers). */
  readonly plannedMinor: number;
  /** Not planned yet: income + carried − planned. */
  readonly totalMinor: number;
}

/**
 * The receipt behind Money to plan. The server only reports the total (Not planned yet), so the
 * carried line is what is left of it after this period's income and plans; the lines always add
 * up to the total. `null` while the income is unknown, so no line guesses.
 */
export function moneyToPlan(
  unassignedMinor: number,
  plannedMinor: number,
  incomeMinor: number | null,
): MoneyToPlan | null {
  if (incomeMinor === null) return null;
  return {
    incomeMinor,
    carriedMinor: unassignedMinor + plannedMinor - incomeMinor,
    plannedMinor,
    totalMinor: unassignedMinor,
  };
}

/** How this month gets planned on C3: repeat last month's plan, or type the amounts. */
export type PlanMode = "repeat" | "adjust";

/** What the primary button does. */
export type PlanPrimary =
  /** Write the repeat batch, then finish. */
  | { readonly kind: "repeat" }
  /** Write the typed amounts, then finish. */
  | { readonly kind: "adjust" }
  /** Nothing to write: back to Budget home. */
  | { readonly kind: "finish"; readonly label: "Done" | "Plan later" }
  /** Last month is still loading. */
  | { readonly kind: "wait" }
  /** A typed amount needs fixing first. */
  | { readonly kind: "blocked" };

interface PlanPrimaryInput {
  readonly canEditPlan: boolean;
  readonly mode: PlanMode;
  readonly lastMonth: LastMonth;
  readonly repeat: { readonly itemCount: number; readonly canRepeat: boolean };
  readonly adjust: { readonly hasChanges: boolean; readonly hasProblem: boolean };
}

/**
 * The primary action for the chosen mode. Repeat that can't run (it failed to load, or the money
 * is short) leaves "Plan later"; a plan that already matches, or no changes, is just "Done".
 */
export function planPrimary({
  canEditPlan,
  mode,
  lastMonth,
  repeat,
  adjust,
}: PlanPrimaryInput): PlanPrimary {
  if (!canEditPlan) return { kind: "finish", label: "Done" };
  if (mode === "adjust") {
    if (adjust.hasProblem) return { kind: "blocked" };
    return adjust.hasChanges ? { kind: "adjust" } : { kind: "finish", label: "Done" };
  }
  if (lastMonth === "loading") return { kind: "wait" };
  if (lastMonth !== "ready") return { kind: "finish", label: "Plan later" };
  if (repeat.itemCount === 0) return { kind: "finish", label: "Done" };
  return repeat.canRepeat ? { kind: "repeat" } : { kind: "finish", label: "Plan later" };
}

export interface PlanPrimaryButton {
  readonly label: string;
  readonly disabled: boolean;
}

/** The primary button for an action: "Plan my month" unless there is nothing to write. */
export function planPrimaryButton(primary: PlanPrimary): PlanPrimaryButton {
  return {
    label: primary.kind === "finish" ? primary.label : "Plan my month",
    disabled: primary.kind === "wait" || primary.kind === "blocked",
  };
}
