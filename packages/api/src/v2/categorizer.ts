import type { Experimental_EvaluationQuestion as EvaluationQuestion } from "ai";

import { MIN_AUTO_CATEGORIZE_CATEGORIES, type V2CategoryKind } from "./contracts";

/**
 * Transaction categorizer pipeline.
 *
 * 1. Jev picks one of the ledger's categories for the note, with an explicit
 *    no-match option, and says whether it recognizes the note at all.
 * 2. When Jev is unsure (no-match, a spread-out distribution, or an unfamiliar
 *    note such as "Breadfast"), an LLM with web search describes what the note
 *    refers to, and Jev decides again with that context.
 *
 * Only the note, its currency, and category names ever leave the server.
 */

export interface CategoryOption {
  readonly id: string;
  readonly name: string;
}

export interface CategorizeRequest {
  readonly note: string;
  readonly kind: V2CategoryKind;
  /** Hints at the country the purchase happened in (EGP → Egypt). */
  readonly currency: string;
  readonly categories: readonly CategoryOption[];
}

export type CategorizeOutcome =
  | { readonly categoryId: string; readonly stage: "jev" | "research" }
  | { readonly categoryId: null; readonly stage: "skipped" | "unknown" };

export interface CategorizeOptions {
  /** Aborts in-flight model calls once the caller's time budget runs out. */
  readonly signal?: AbortSignal;
  /** Rate-limit gate for the paid research step; false leaves the note uncategorized. */
  readonly allowResearch?: () => Promise<boolean>;
}

export interface TransactionCategorizer {
  categorize(request: CategorizeRequest, options?: CategorizeOptions): Promise<CategorizeOutcome>;
}

export interface JevState {
  readonly [key: string]: string | { readonly [key: string]: string };
}

export interface JevRequest {
  readonly state: JevState;
  readonly questions: {
    readonly category: EvaluationQuestion & { readonly type: "choice" };
    readonly recognized?: EvaluationQuestion & { readonly type: "boolean" };
  };
}

export interface JevAnswers {
  readonly category: {
    readonly choice: string;
    readonly probabilities?: Readonly<Record<string, number>>;
  };
  readonly recognized?: { readonly probability: number };
}

export interface ResearchRequest {
  readonly note: string;
  readonly kind: V2CategoryKind;
  readonly currency: string;
}

/** The two model calls the pipeline needs; the AI Gateway adapter implements them. */
export interface CategorizerModels {
  evaluate(request: JevRequest, signal?: AbortSignal): Promise<JevAnswers>;
  /** A short description of what the note refers to, or null when it can't tell. */
  research(request: ResearchRequest, signal?: AbortSignal): Promise<string | null>;
}

// Starting points, not tuned values: revisit them against real notes.
/** Jev's first answer is used directly only at or above this probability. */
export const DIRECT_ACCEPT_PROBABILITY = 0.6;
/** Below this P(recognized), Jev is likely pattern-matching an unfamiliar name. */
export const RECOGNIZED_FLOOR = 0.5;
/** With research context, a slightly lower bar is enough. */
export const RESEARCHED_ACCEPT_PROBABILITY = 0.5;

/** A Choice accepts up to 255 options; one is reserved for the no-match label. */
const MAX_CATEGORY_OPTIONS = 254;
const NO_MATCH_LABELS = ["other", "none of these", "no listed category"] as const;

export interface CategoryLabels {
  /** Choice label → category id. */
  readonly categories: ReadonlyMap<string, string>;
  readonly noMatch: string;
}

/** Category names become Choice labels, since Jev reads labels; duplicates get a suffix. */
export function labelCategories(categories: readonly CategoryOption[]): CategoryLabels {
  const labels = new Map<string, string>();
  const taken = new Set<string>();
  for (const category of categories.slice(0, MAX_CATEGORY_OPTIONS)) {
    const base = category.name.trim();
    let label = base;
    for (let suffix = 2; taken.has(label.toLowerCase()); suffix += 1) label = `${base} (${suffix})`;
    taken.add(label.toLowerCase());
    labels.set(label, category.id);
  }
  const noMatch = NO_MATCH_LABELS.find((label) => !taken.has(label)) ?? "__no_match__";
  return { categories: labels, noMatch };
}

const CATEGORY_INSTRUCTIONS = {
  question: "Which of this person's own budget categories should `transaction` be filed under?",
  guidance: [
    "`transaction.note` is a short note the person typed. It is often a merchant, app, or brand name, and may be misspelled.",
    "`transaction.currency` hints at the country where the money was spent or received.",
    "When present, `merchant_context` is research on what the note refers to. Trust it over a resemblance to some other word.",
    "Pick the no-match option instead of guessing from a name you do not recognize or that only looks like another word.",
  ],
};

const RECOGNIZED_QUESTION = {
  type: "boolean",
  instructions:
    "Is it clear what `transaction.note` refers to, as a well-known merchant, brand, or service, or a plain description of what was bought, without guessing from its resemblance to another word?",
  criteria: {
    true: "Recognizable as written",
    false: "An unfamiliar name, ambiguous, or possibly a misspelling of something else",
  },
} as const;

export function buildJevRequest(
  request: CategorizeRequest,
  labels: CategoryLabels,
  merchantContext?: string,
): JevRequest {
  const criteria: Record<string, string | null> = {};
  for (const label of labels.categories.keys()) criteria[label] = null;
  criteria[labels.noMatch] =
    "The note is unclear, is a name you do not recognize, or fits none of the other categories";
  const transaction = { note: request.note, kind: request.kind, currency: request.currency };
  const category = { type: "choice", instructions: CATEGORY_INSTRUCTIONS, criteria } as const;
  if (merchantContext) {
    return {
      state: { transaction, merchant_context: merchantContext },
      questions: { category },
    };
  }
  return { state: { transaction }, questions: { category, recognized: RECOGNIZED_QUESTION } };
}

/**
 * The chosen category id when Jev's answer clears `threshold`, else null.
 * Probabilities are how Jev expresses doubt; without them the answer counts as unsure.
 */
function acceptedCategory(
  answer: JevAnswers["category"],
  labels: CategoryLabels,
  threshold: number,
): string | null {
  const categoryId = labels.categories.get(answer.choice) ?? null;
  const probability = answer.probabilities?.[answer.choice] ?? 0;
  return probability >= threshold ? categoryId : null;
}

const UNKNOWN: CategorizeOutcome = { categoryId: null, stage: "unknown" };

export async function categorizeNote(
  request: CategorizeRequest,
  models: CategorizerModels,
  options: CategorizeOptions = {},
): Promise<CategorizeOutcome> {
  const note = request.note.trim();
  if (!note || request.categories.length < MIN_AUTO_CATEGORIZE_CATEGORIES)
    return { categoryId: null, stage: "skipped" };
  const normalized = { ...request, note };
  const labels = labelCategories(request.categories);

  const first = await models.evaluate(buildJevRequest(normalized, labels), options.signal);
  const direct = acceptedCategory(first.category, labels, DIRECT_ACCEPT_PROBABILITY);
  const recognized = (first.recognized?.probability ?? 0) >= RECOGNIZED_FLOOR;
  if (direct && recognized) return { categoryId: direct, stage: "jev" };

  const researched = await researchAndDecide(normalized, labels, models, options);
  return researched ? { categoryId: researched, stage: "research" } : UNKNOWN;
}

/** Second pass: look up what the note refers to, then let Jev decide with that context. */
async function researchAndDecide(
  request: CategorizeRequest,
  labels: CategoryLabels,
  models: CategorizerModels,
  { signal, allowResearch = async () => true }: CategorizeOptions,
): Promise<string | null> {
  if (!(await allowResearch())) return null;
  const context = await models.research(
    { note: request.note, kind: request.kind, currency: request.currency },
    signal,
  );
  if (!context) return null;
  const second = await models.evaluate(buildJevRequest(request, labels, context), signal);
  return acceptedCategory(second.category, labels, RESEARCHED_ACCEPT_PROBABILITY);
}
