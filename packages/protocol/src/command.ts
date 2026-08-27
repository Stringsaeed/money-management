/**
 * Command envelope: the unit of a client write.
 *
 * A command is a domain intent (not a row diff) carrying a client-generated
 * `commandId` that doubles as its idempotency key. Applied optimistically to
 * the local cache on creation, queued in the outbox, and processed exactly
 * once server-side regardless of retry count.
 */

import type { Effects } from "./effects.js";

/**
 * The vocabulary of domain intents, grown phase by phase as the backend
 * lands. `CommandKind` values are stable wire identifiers — never rename one,
 * only add.
 */
export const COMMAND_KINDS = [
  "household.create",
  "member.invite",
  "member.role.change",
  "member.remove",
  "account.create",
  "account.update",
  "account.archive",
  "category.create",
  "category.update",
  "category.archive",
  "transaction.create",
  "transaction.edit",
  "transaction.remove",
  "assignment.commit",
  "card_payment.record",
  "refund.link",
  "import_bundle",
] as const;

export type CommandKind = (typeof COMMAND_KINDS)[number];

/** Household roles resolved through the capability map, `can(role, kind)`. */
export type HouseholdRole = "owner" | "admin" | "member" | "viewer";

export const HOUSEHOLD_ROLES: readonly HouseholdRole[] = ["owner", "admin", "member", "viewer"];

/**
 * Optimistic-concurrency preconditions, generalizing the existing Rule
 * Revision pattern:
 *
 * - `expectedVersion` for mutable entities (rejection: stale_version)
 * - `expectedAsOf` predicates for append-only facts or derived state,
 *   re-validated at commit inside the advisory-locked section
 *   (rejection: conflict)
 */
export interface Precondition {
  /** Entity id the version check applies to; omitted for household-wide predicates. */
  readonly entityId?: string;
  readonly expectedVersion?: number;
  /** Human-readable predicate name, e.g. "unassigned_money_gte". */
  readonly predicate?: string;
  /** Predicate arguments, e.g. { minor: 5000 } — validated at commit time. */
  readonly args?: Readonly<Record<string, unknown>>;
}

/**
 * The envelope posted to `POST /commands`. Payloads are intentionally opaque
 * here: each kind's payload schema lives with its handler in `apps/api`; the
 * protocol fixes only the envelope and result machinery.
 */
export interface CommandEnvelope<TPayload = unknown> {
  /** Client-generated UUID; doubles as the idempotency key. */
  readonly commandId: string;
  readonly householdId: string;
  readonly kind: CommandKind;
  readonly payload: TPayload;
  readonly preconditions?: readonly Precondition[];
  /**
   * Client clock at creation, for audit ordering only — never trusted for
   * period membership (ADR-0021: Ledger Date decides).
   */
  readonly issuedAt?: string;
}

/** A typed field-level rejection reason for invalid intents. */
export interface ValidationIssue {
  readonly field: string;
  readonly message: string;
}

/**
 * Result of processing a command. Every terminal state is explicit: partial
 * application is never observable — either the whole command commits or it is
 * returned to the client as a typed rejection.
 */
export type CommandResult<TApplied = unknown> =
  | AppliedResult<TApplied>
  | StaleVersionResult
  | InvalidIntentResult
  | PreviewRequiredResult
  | MissingEntityResult
  | ForbiddenResult
  | ConflictResult
  | LocalOnlyResult;

export interface AppliedResult<TApplied = unknown> {
  readonly kind: "applied";
  /** Sequence number of the appended `HouseholdChange`. */
  readonly seq: number;
  /** What this command invalidated — drives cache writeback + invalidation. */
  readonly effects: Effects;
  /** Recomputed rows/projections for optimistic-writeback reconciliation. */
  readonly applied: TApplied;
  /** True when the command was replayed from the idempotency store. */
  readonly replayed: boolean;
}

export interface StaleVersionResult {
  readonly kind: "stale_version";
  readonly entityId: string;
  readonly expectedVersion: number;
  readonly actualVersion: number;
}

export interface InvalidIntentResult {
  readonly kind: "invalid_intent";
  readonly issues: readonly ValidationIssue[];
}

/**
 * The command is valid but requires an expensive recompute preview before the
 * user can confirm (e.g. historical edits recalculating later periods). The
 * server has not applied anything.
 */
export interface PreviewRequiredResult {
  readonly kind: "preview_required";
  readonly issues: readonly ValidationIssue[];
}

export interface MissingEntityResult {
  readonly kind: "missing_entity";
  readonly entityType: string;
  readonly entityId: string;
}

export interface ForbiddenResult {
  readonly kind: "forbidden";
  /** Role held by the actor at authorization time. */
  readonly role: HouseholdRole | null;
  readonly requiredCapability: string;
}

export interface ConflictResult {
  readonly kind: "conflict";
  /** Machine-readable reason, e.g. "unassigned_money_changed". */
  readonly reason: string;
  /** Current values relevant to the failed precondition, for rebasing UI. */
  readonly current?: Readonly<Record<string, unknown>>;
}

/**
 * The server is deliberately refusing writes (remote `kill_switch_local_only`
 * flag engaged). Nothing was applied and the command stays valid — the client
 * should keep it queued locally and continue in local-only mode until the
 * switch is turned off again.
 */
export interface LocalOnlyResult {
  readonly kind: "local_only";
  readonly reason: "kill_switch_local_only";
}
