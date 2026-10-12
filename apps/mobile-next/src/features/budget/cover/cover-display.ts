import { compactAmount } from "@/ui/trove";

import type { V2Category } from "@trove/api/v2/contracts";

import { envelopeEmoji } from "../envelope/envelope-display";
import { receiptFigure, signedCompact } from "../envelope/envelope-figures";
import type { EnvelopeLine } from "../home/home-model";

import {
  UNPLANNED_KEY,
  type CoverMode,
  type CoverPlan,
  type CoverTake,
  type Place,
  type PlaceKind,
} from "./cover-move-model";

/** Design copy for Not planned yet, which has no Category to borrow an emoji from. */
export const NOT_PLANNED_EMOJI = "🫙";

/** Emoji by place key: the jar for Not planned yet, each envelope its first Category's emoji. */
export function placeEmojis(
  lines: readonly EnvelopeLine[],
  categoriesById: ReadonlyMap<string, Pick<V2Category, "icon">>,
): ReadonlyMap<string, string> {
  const emojis = new Map<string, string>([[UNPLANNED_KEY, NOT_PLANNED_EMOJI]]);
  for (const { envelope } of lines)
    emojis.set(envelope.id, envelopeEmoji(envelope, categoriesById));
  return emojis;
}

/** Safe to spend is Everyday Left plus Not planned yet; only money crossing that line moves it. */
export const countsTowardSafe = (kind: PlaceKind) => kind === "unplanned" || kind === "everyday";

/** How a move of `amountMinor` from one kind of place to another changes Safe to spend. */
export function safeToSpendDelta(from: PlaceKind, to: PlaceKind, amountMinor: number): number {
  return (countsTowardSafe(to) ? amountMinor : 0) - (countsTowardSafe(from) ? amountMinor : 0);
}

/** `1,665 · SAME`, `1,840 · UP 175`, `1,490 · DOWN 175`. */
export function safeToSpendAfter(safeMinor: number, deltaMinor: number, currency: string): string {
  const after = signedCompact(safeMinor + deltaMinor, currency);
  if (deltaMinor === 0) return `${after} · SAME`;
  return `${after} · ${deltaMinor > 0 ? "UP" : "DOWN"} ${compactAmount(deltaMinor, currency)}`;
}

export interface AfterLine {
  readonly label: string;
  readonly value: string;
  /** The Safe to spend total: bold, on the lime marker. */
  readonly total?: boolean;
}

interface CoverTarget {
  readonly name: string;
  readonly kind: PlaceKind;
  /** The covered envelope's Left now. */
  readonly leftMinor: number;
}

interface BudgetNow {
  readonly unassignedMinor: number;
  readonly safeToSpendMinor: number;
  readonly currency: string;
}

const caps = (name: string) => name.toUpperCase();

/**
 * The AFTER receipt of a cover: the covered envelope (or, for a pay-back, Not planned yet), every
 * source it takes from, and Safe to spend.
 */
export function coverAfterLines(
  mode: CoverMode,
  plan: CoverPlan,
  target: CoverTarget,
  now: BudgetNow,
): AfterLine[] {
  const { currency } = now;
  const into: PlaceKind = mode === "past" ? "unplanned" : target.kind;
  const delta = plan.takes.reduce(
    (sum, take) => sum + safeToSpendDelta(take.place.kind, into, take.takeMinor),
    0,
  );
  const sources = plan.takes.map((take) => ({
    label: caps(take.place.name),
    value: receiptFigure(take.afterMinor, currency),
  }));
  const receiver =
    mode === "past"
      ? {
          label: "NOT PLANNED YET",
          value: receiptFigure(now.unassignedMinor + plan.coveredMinor, currency),
        }
      : {
          label: caps(target.name),
          value: receiptFigure(target.leftMinor + plan.coveredMinor, currency),
        };
  return [
    ...(mode === "past" ? [...sources, receiver] : [receiver, ...sources]),
    {
      label: "SAFE TO SPEND",
      value: safeToSpendAfter(now.safeToSpendMinor, delta, currency),
      total: true,
    },
  ];
}

export interface SourceGroup {
  readonly key: string;
  /** Mono caps title, e.g. "EVERYDAY". */
  readonly label: string;
  readonly places: readonly Place[];
}

/** Ranked sources in their board groups: best first, Everyday, then bills with spare and savings. */
export function coverSourceGroups(ranked: readonly Place[]): SourceGroup[] {
  const of = (kinds: readonly PlaceKind[]) => ranked.filter((place) => kinds.includes(place.kind));
  const unplanned = of(["unplanned"]);
  const everyday = of(["everyday"]);
  const rest = of(["bills", "saving"]);
  const hasBills = rest.some((place) => place.kind === "bills");
  const hasSaving = rest.some((place) => place.kind === "saving");
  const restLabel =
    hasBills && hasSaving
      ? "BILLS WITH SPARE · SAVINGS"
      : hasBills
        ? "BILLS WITH SPARE"
        : "SAVINGS";
  return [
    { key: "best", label: "BEST FIRST · KEEPS SAFE TO SPEND HONEST", places: unplanned },
    { key: "everyday", label: "EVERYDAY", places: everyday },
    { key: "rest", label: restLabel, places: rest },
  ].filter((group) => group.places.length > 0);
}

export type SourceSubTone = "accent" | "tertiary" | "warning";

export interface SourceSub {
  readonly text: string;
  readonly tone: SourceSubTone;
}

/**
 * A source row's mono line. Savings always warn that we will ask again. Otherwise the row shows
 * what it keeps: after its take when it is part of the cover, after covering everything when it
 * could alone, or that it can only cover part.
 */
export function coverSourceSub(
  place: Place,
  take: CoverTake | undefined,
  amountMinor: number,
  currency: string,
): SourceSub {
  if (place.kind === "saving") return { text: "SAVINGS · WE'LL ASK AGAIN", tone: "warning" };
  if (take) return { text: `AFTER: ${signedCompact(take.afterMinor, currency)}`, tone: "accent" };
  if (place.availableMinor >= amountMinor)
    return {
      text: `AFTER: ${signedCompact(place.availableMinor - amountMinor, currency)}`,
      tone: "tertiary",
    };
  return {
    text: `${compactAmount(place.availableMinor, currency)} SPARE · PARTIAL`,
    tone: "tertiary",
  };
}

export interface CoverStampLine {
  readonly text: string;
  readonly tone: "negative" | "warning";
}

/** Mono caps line over the title: `🍽️ DINING & COFFEE · OVER BY 175`. */
export function coverStamp(
  mode: CoverMode,
  name: string,
  emoji: string | undefined,
  amountMinor: number,
  currency: string,
): CoverStampLine {
  const figure = compactAmount(amountMinor, currency);
  const lead = emoji ? `${emoji} ${caps(name)}` : caps(name);
  switch (mode) {
    case "over":
      return { text: `${lead} · OVER BY ${figure}`, tone: "negative" };
    case "short":
      return { text: `${lead} · SHORT BY ${figure}`, tone: "warning" };
    case "past":
      return { text: `${lead} · LAST MONTH OVER BY ${figure}`, tone: "negative" };
  }
}

export const coverTitle = (mode: CoverMode) =>
  mode === "past" ? "Pay it back from…" : "Cover it from…";
