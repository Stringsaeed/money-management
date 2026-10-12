import { format, parseISO } from "date-fns";

import { type V2Account, type V2Category, type V2PaydayRule } from "@trove/api/v2/contracts";
import { periodContaining } from "@trove/domain/budget";

import { ApiError } from "@/data/http";
import { currencyFractionDigits } from "@/utils/money";

import { currencyErrorMessage } from "../currency/currency-errors";
import { roleErrorMessage } from "../role/budget-role";

import type { EnvelopeLine } from "../home/home-model";

/** More envelopes than this and the picker gets a search field. */
export const ENVELOPE_SEARCH_THRESHOLD = 8;

export interface Impact {
  readonly text: string;
  readonly over: boolean;
  /** How far past zero the envelope ends up; 0 unless `over`. */
  readonly overMinor: number;
}

/** What saving this amount does to the envelope's Left today, from the same numbers as Envelope detail. */
export function impactLine(
  name: string,
  leftMinor: number,
  amountMinor: number,
  money: (minor: number) => string,
): Impact | null {
  if (amountMinor <= 0) return null;
  const after = leftMinor - amountMinor;
  if (after < 0)
    return { text: `${name} will be ${money(-after)} over`, over: true, overMinor: -after };
  return { text: `${name}: ${money(after)} left after this`, over: false, overMinor: 0 };
}

/**
 * Money on the impact pill: the currency's own format, with the decimals only when they carry
 * value ("AED 175", "AED 62.50"), as the Quick add board prints it.
 */
export function impactMoney(minor: number, currency: string): string {
  const digits = currencyFractionDigits(currency);
  const scale = 10 ** digits;
  const whole = minor % scale === 0;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : digits,
    maximumFractionDigits: digits,
  }).format(minor / scale);
}

export interface PaidWithAccounts {
  readonly funding: readonly V2Account[];
  readonly cards: readonly V2Account[];
}

/** Accounts a budget expense can come from: the money you have, plus credit cards, in the budget's currency. */
export function paidWithAccounts(
  accounts: readonly V2Account[],
  fundingAccountIds: readonly string[],
  currency: string,
): PaidWithAccounts {
  const usable = accounts.filter((account) => !account.archived && account.currency === currency);
  return {
    funding: usable.filter((account) => fundingAccountIds.includes(account.id)),
    cards: usable.filter(
      (account) => account.type === "credit_card" && !fundingAccountIds.includes(account.id),
    ),
  };
}

/** Last used account, else the budget's default, else the first account on offer. */
export function resolveDefaultAccountId(
  eligibleIds: readonly string[],
  lastUsedId: string | null,
  budgetDefaultId: string | null,
): string | null {
  for (const candidate of [lastUsedId, budgetDefaultId]) {
    if (candidate && eligibleIds.includes(candidate)) return candidate;
  }
  return eligibleIds[0] ?? null;
}

/** Recently used envelopes first (most recent first), then the rest in their own order. */
export function orderEnvelopes(
  lines: readonly EnvelopeLine[],
  recentIds: readonly string[],
): EnvelopeLine[] {
  const byId = new Map(lines.map((line) => [line.envelope.id, line]));
  const recent = recentIds.flatMap((id) => byId.get(id) ?? []);
  const recentSet = new Set(recent.map((line) => line.envelope.id));
  return [...recent, ...lines.filter((line) => !recentSet.has(line.envelope.id))];
}

/** Envelopes whose name contains `query`; the selected one always stays so it never vanishes. */
export function filterEnvelopes(
  lines: readonly EnvelopeLine[],
  query: string,
  selectedId: string | null,
): EnvelopeLine[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...lines];
  return lines.filter(
    (line) => line.envelope.id === selectedId || line.envelope.name.toLowerCase().includes(needle),
  );
}

export type DatePlacement =
  | { readonly kind: "current" }
  | { readonly kind: "future" }
  | { readonly kind: "earlier"; readonly label: string }
  | { readonly kind: "before_budget" };

interface PlacementInput {
  readonly date: string;
  readonly today: string;
  readonly currentStart: string;
  readonly activationStart: string;
  readonly rule: V2PaydayRule;
}

const shortDate = (date: string) => format(parseISO(date), "d MMM");

/**
 * Which Budget Period a dated expense lands in. Earlier periods use the payday rule in effect now:
 * `GET /budget` does not carry the payday history, so a period before a payday change can be off.
 */
export function datePlacement(input: PlacementInput): DatePlacement {
  const { date, today, currentStart, activationStart, rule } = input;
  if (date > today) return { kind: "future" };
  if (date >= currentStart) return { kind: "current" };
  const period = periodContaining(rule, date);
  if (period.start < activationStart) return { kind: "before_budget" };
  return { kind: "earlier", label: `${shortDate(period.start)} – ${shortDate(period.end)}` };
}

/** The sentence shown under the date, and in the toast after saving. */
export function placementText(placement: DatePlacement): string | null {
  switch (placement.kind) {
    case "earlier":
      return `Added to ${placement.label}`;
    case "before_budget":
      return "Before your budget started, so no envelope counts it";
    case "future":
      return "Dated ahead, so it counts from that day";
    case "current":
      return null;
  }
}

/** Honest failure copy: a dropped connection and a rejected save both mean nothing was saved. */
export function saveErrorMessage(cause: unknown): string {
  const refused = roleErrorMessage(cause) ?? currencyErrorMessage(cause);
  if (refused) return refused;
  if (cause instanceof ApiError && cause.code === "network_error") {
    return "You're offline. Nothing was saved.";
  }
  return "Couldn't save this spending. Nothing was saved, so try again.";
}

/** The active expense Categories an envelope maps to; more than one means Quick add asks which. */
export function envelopeCategories(
  line: EnvelopeLine | null,
  categories: readonly V2Category[],
): V2Category[] {
  if (!line) return [];
  return categories.filter(
    (category) =>
      line.envelope.categoryIds.includes(category.id) &&
      !category.archived &&
      category.kind === "expense",
  );
}

interface SpendDraft {
  readonly amountMinor: number;
  readonly envelope: EnvelopeLine | null;
  readonly accountId: string | null;
  readonly categoryId: string | null;
}

export type SpendCheck =
  | { readonly ok: false; readonly message: string }
  | {
      readonly ok: true;
      readonly amountMinor: number;
      readonly envelope: EnvelopeLine;
      readonly accountId: string;
      readonly categoryId: string;
    };

/** Either the pieces of a saveable expense, or what to fix first. */
export function checkSpend(draft: SpendDraft): SpendCheck {
  const { amountMinor, envelope, accountId, categoryId } = draft;
  if (amountMinor <= 0) {
    return { ok: false, message: "Enter an amount above zero to save this spending." };
  }
  if (!envelope) return { ok: false, message: "Pick the envelope this came out of." };
  if (!accountId) return { ok: false, message: "Pick the account you paid with." };
  if (!categoryId) {
    return {
      ok: false,
      message: `${envelope.envelope.name} has no category yet. Add one to the envelope first.`,
    };
  }
  return { ok: true, amountMinor, envelope, accountId, categoryId };
}

/** The chosen Category if it is one of the envelope's, else the envelope's first. */
export function pickCategoryId(
  choices: readonly V2Category[],
  chosenId: string | null,
): string | null {
  return choices.find((category) => category.id === chosenId)?.id ?? choices[0]?.id ?? null;
}

/** Envelope detail's Left is for the current period, so the impact only applies to dates in it. */
export function spendImpact(
  line: EnvelopeLine | null,
  placement: DatePlacement,
  amountMinor: number,
  money: (minor: number) => string,
): Impact | null {
  if (!line || placement.kind !== "current") return null;
  return impactLine(line.envelope.name, line.totals.leftMinor, amountMinor, money);
}
