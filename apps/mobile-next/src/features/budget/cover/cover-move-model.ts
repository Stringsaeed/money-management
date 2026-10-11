import type { V2AssignmentsCreateInput, V2EnvelopeGroup } from "@trove/api/v2/contracts";

import type { EnvelopeLine } from "../home/home-model";

import type { CoverMoveRequest } from "./use-cover-move-request";

/**
 * - over: O2, this envelope is overspent now.
 * - short: B1, a bill needs more than its Left before it is due.
 * - past: C1, last period's overspend is paid back into Not planned yet.
 */
export type CoverMode = "over" | "short" | "past";

export type CoverRequest = Extract<CoverMoveRequest, { kind: "cover" | "cover-past" }>;

export function coverMode(request: CoverRequest): CoverMode {
  if (request.kind === "cover-past") return "past";
  return request.amountMinor === undefined ? "over" : "short";
}

export const UNPLANNED_KEY = "unplanned";

export type PlaceKind = "unplanned" | V2EnvelopeGroup;

/**
 * Somewhere money can sit: Not planned yet, or an envelope. `availableMinor` is the number the
 * server checks a move against: Not planned yet for the first, Left for an envelope.
 */
export interface Place {
  readonly key: string;
  /** `null` is Not planned yet, the API's null side. */
  readonly id: string | null;
  readonly name: string;
  readonly kind: PlaceKind;
  readonly availableMinor: number;
}

/** Not planned yet, then every active envelope in the server's order. */
export function placesFrom(lines: readonly EnvelopeLine[], unassignedMinor: number): Place[] {
  return [
    {
      key: UNPLANNED_KEY,
      id: null,
      name: "Not planned yet",
      kind: "unplanned",
      availableMinor: unassignedMinor,
    },
    ...lines.map(({ envelope, totals }) => ({
      key: envelope.id,
      id: envelope.id,
      name: envelope.name,
      kind: envelope.group,
      availableMinor: totals.leftMinor,
    })),
  ];
}

const KIND_RANK = { unplanned: 0, everyday: 1, bills: 2, saving: 3 } as const satisfies Record<
  PlaceKind,
  number
>;

/**
 * Where a cover can come from, best first: Not planned yet, Everyday by most Left, Bills with a
 * surplus, then Saving for. Only places with money in them, and never the envelope being covered.
 */
export function rankCoverSources(places: readonly Place[], targetKey: string): Place[] {
  return places
    .filter((place) => place.key !== targetKey && place.availableMinor > 0)
    .sort((a, b) => KIND_RANK[a.kind] - KIND_RANK[b.kind] || b.availableMinor - a.availableMinor);
}

/**
 * Where last period's overspend can be paid back from: envelopes with Left now, the overspent
 * one included. Never Not planned yet: the overspend already came out of it.
 */
export function rankPastCoverSources(places: readonly Place[]): Place[] {
  return rankCoverSources(
    places.filter((place) => place.kind !== "unplanned"),
    UNPLANNED_KEY,
  );
}

export interface CoverTake {
  readonly place: Place;
  readonly takeMinor: number;
  /** What the source has left once this move is made. */
  readonly afterMinor: number;
}

export interface CoverPlan {
  readonly takes: readonly CoverTake[];
  readonly coveredMinor: number;
  /** What the selected sources could not give. */
  readonly restMinor: number;
  readonly takesFromSaving: boolean;
}

/** Fill `amountMinor` from the selected sources in ranked order; each gives at most its available. */
export function allocateCover(
  ranked: readonly Place[],
  selectedKeys: readonly string[],
  amountMinor: number,
): CoverPlan {
  let remaining = Math.max(amountMinor, 0);
  const takes: CoverTake[] = [];
  for (const place of ranked) {
    if (remaining === 0) break;
    if (!selectedKeys.includes(place.key)) continue;
    const takeMinor = Math.min(remaining, Math.max(place.availableMinor, 0));
    if (takeMinor === 0) continue;
    takes.push({ place, takeMinor, afterMinor: place.availableMinor - takeMinor });
    remaining -= takeMinor;
  }
  return {
    takes,
    coveredMinor: Math.max(amountMinor, 0) - remaining,
    restMinor: remaining,
    takesFromSaving: takes.some((take) => take.place.kind === "saving"),
  };
}

/** Start with the best sources that together cover the amount. Saving for is never pre-picked. */
export function defaultCoverSelection(ranked: readonly Place[], amountMinor: number): string[] {
  const keys: string[] = [];
  let remaining = amountMinor;
  for (const place of ranked) {
    if (remaining <= 0) break;
    if (place.kind === "saving") continue;
    keys.push(place.key);
    remaining -= place.availableMinor;
  }
  return keys;
}

/** One assignment per source, all `cover`, into the envelope. */
export function coverInput(targetId: string, plan: CoverPlan): V2AssignmentsCreateInput {
  return {
    items: plan.takes.map(({ place, takeMinor }) => ({
      fromEnvelopeId: place.id,
      toEnvelopeId: targetId,
      amountMinor: takeMinor,
      reason: "cover" as const,
    })),
  };
}

/** One `cover` per source, back into Not planned yet in the current period. */
export function pastCoverInput(plan: CoverPlan): V2AssignmentsCreateInput {
  return {
    items: plan.takes.map(({ place, takeMinor }) => ({
      fromEnvelopeId: place.id,
      toEnvelopeId: null,
      amountMinor: takeMinor,
      reason: "cover" as const,
    })),
  };
}

/** Where this kind of cover can come from, best first. */
export const coverSources = (mode: CoverMode, places: readonly Place[], targetKey: string) =>
  mode === "past" ? rankPastCoverSources(places) : rankCoverSources(places, targetKey);

/** The assignments a cover writes: into the envelope now, or back into Not planned yet. */
export const coverWrite = (mode: CoverMode, targetId: string, plan: CoverPlan) =>
  mode === "past" ? pastCoverInput(plan) : coverInput(targetId, plan);

export type MovePreview =
  | { readonly status: "no_amount"; readonly capMinor: number }
  | { readonly status: "over_cap"; readonly capMinor: number }
  | {
      readonly status: "ok";
      readonly capMinor: number;
      readonly fromAfterMinor: number;
      readonly toAfterMinor: number;
    };

/** Move is capped at what the source has; the preview is the same arithmetic the server applies. */
export function movePreview(from: Place, to: Place, amountMinor: number): MovePreview {
  const capMinor = Math.max(from.availableMinor, 0);
  if (amountMinor <= 0) return { status: "no_amount", capMinor };
  if (amountMinor > capMinor) return { status: "over_cap", capMinor };
  return {
    status: "ok",
    capMinor,
    fromAfterMinor: from.availableMinor - amountMinor,
    toAfterMinor: to.availableMinor + amountMinor,
  };
}

export function moveInput(from: Place, to: Place, amountMinor: number): V2AssignmentsCreateInput {
  return {
    items: [{ fromEnvelopeId: from.id, toEnvelopeId: to.id, amountMinor, reason: "move" }],
  };
}

/** What a valid move will leave behind, or why the amount can't be moved yet. */
function previewHint(
  from: Place,
  to: Place,
  amountMinor: number,
  money: (minor: number) => string,
): string | null {
  const preview = movePreview(from, to, amountMinor);
  if (preview.status === "over_cap")
    return `${from.name} only has ${money(preview.capMinor)} to move.`;
  if (preview.status === "no_amount") return null;
  return `After: ${from.name} ${money(preview.fromAfterMinor)}, ${to.name} ${money(preview.toAfterMinor)}`;
}

/** The line under the amount: what is allowed, what went wrong, or what the move will leave. */
export function moveHint(input: {
  readonly from: Place;
  readonly to: Place | undefined;
  readonly text: string;
  readonly amountMinor: number | null;
  readonly money: (minor: number) => string;
}): string {
  const { from, to, text, amountMinor, money } = input;
  if (amountMinor === null && text.trim() !== "") return "Enter an amount like 350 or 350.50.";
  const shown = to && amountMinor !== null ? previewHint(from, to, amountMinor, money) : null;
  if (shown) return shown;
  const cap = Math.max(from.availableMinor, 0);
  return cap > 0 ? `Up to ${money(cap)} from ${from.name}.` : `${from.name} has nothing to move.`;
}
