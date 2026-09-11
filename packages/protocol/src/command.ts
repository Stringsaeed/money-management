/**
 * Command envelope: the unit of a client write.
 *
 * A command is a domain intent (not a row diff) carrying a client-generated
 * `commandId` that doubles as its idempotency key. Applied optimistically to
 * a PowerSync collection, carried through the SDK upload queue, and processed
 * exactly once server-side regardless of retry count.
 */

import type { Effects } from "./effects.js";
import { type LedgerScope, ledgerIdForScope } from "./ledger-scope.js";

/**
 * The vocabulary of domain intents, grown phase by phase as the backend
 * lands. `CommandKind` values are stable wire identifiers — never rename one,
 * only add. A retired kind is removed from the list and rejected by the server
 * as `unknown_kind`; `member.role.change` retired when Household roles moved
 * to WorkOS organization memberships (ADR 0027).
 */
export const COMMAND_KINDS = [
  "account.create",
  "account.update",
  "account.archive",
  "category.create",
  "category.update",
  "category.archive",
  "transaction.create",
  "transaction.edit",
  "transaction.remove",
  "recurring.change",
  "budget.configure",
  "assignment.commit",
  "assignment.correct",
  "refund.link",
  "import_bundle",
] as const;

export type CommandKind = (typeof COMMAND_KINDS)[number];

/** True when `value` is a registered command kind on the wire vocabulary. */
export function isCommandKind(value: string): value is CommandKind {
  for (const kind of COMMAND_KINDS) {
    if (kind === value) {
      return true;
    }
  }
  return false;
}

/**
 * Household roles are the WorkOS organization membership role slugs, resolved
 * through the capability map `can(role, kind)`. A role slug outside this list
 * is unknown and grants nothing.
 */
export type HouseholdRole = "admin" | "member" | "viewer";

export const HOUSEHOLD_ROLES: readonly HouseholdRole[] = ["admin", "member", "viewer"];

/** True when a WorkOS role slug is one Trove knows how to authorize. */
export function isHouseholdRole(value: string): value is HouseholdRole {
  return HOUSEHOLD_ROLES.some((role) => role === value);
}

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
 * The Ledger Scope a command addresses, as it travels on the wire.
 *
 * A personal command names no owner: the server binds it to the authenticated
 * User, so one User can never post into another User's Personal Ledger.
 * An organization command names the organization — which, until Household
 * administration migrates to WorkOS (#228), is the Household id.
 */
export type CommandScope =
  | { readonly type: "personal" }
  | { readonly type: "organization"; readonly organizationId: string };

/**
 * The envelope posted to `POST /commands`. Payloads are intentionally opaque
 * here: each kind's payload schema lives with its handler in `apps/api`; the
 * protocol fixes only the envelope and result machinery.
 */
export interface CommandEnvelope<TPayload = unknown> {
  /** Client-generated UUID; doubles as the idempotency key. */
  readonly commandId: string;
  /**
   * Ledger this command writes to. Omitted only by clients predating the
   * Ledger Scope prefactor, where `householdId` alone names an organization.
   */
  readonly scope?: CommandScope;
  /**
   * Household backing an organization-scoped command. Retained so existing
   * clients and the Household import path keep working; `scope` supersedes it.
   */
  readonly householdId?: string;
  readonly kind: CommandKind;
  readonly payload: TPayload;
  readonly preconditions?: readonly Precondition[];
  /**
   * Client clock at creation, for audit ordering only — never trusted for
   * period membership (ADR-0021: Ledger Date decides).
   */
  readonly issuedAt?: string;
}

/**
 * Resolves an envelope's Ledger Scope against the authenticated User. Returns
 * null when the envelope names neither a scope nor a household, which is an
 * invalid intent rather than a silent default.
 */
export function resolveCommandScope(
  envelope: Pick<CommandEnvelope, "householdId" | "scope">,
  authenticatedUserId: string,
): LedgerScope | null {
  if (envelope.scope) {
    return envelope.scope.type === "personal"
      ? { type: "personal", userId: authenticatedUserId }
      : { type: "organization", organizationId: envelope.scope.organizationId };
  }
  if (envelope.householdId) {
    return { type: "organization", organizationId: envelope.householdId };
  }
  return null;
}

/**
 * The ledger id an envelope addresses, for clients that must label a queued or
 * rejected command before the server answers.
 */
export function commandLedgerId(
  envelope: Pick<CommandEnvelope, "householdId" | "scope">,
  authenticatedUserId: string,
): string | null {
  const scope = resolveCommandScope(envelope, authenticatedUserId);
  return scope ? ledgerIdForScope(scope) : null;
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
