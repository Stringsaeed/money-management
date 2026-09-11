import type { SQL } from "drizzle-orm";
import { and, eq } from "drizzle-orm";
import type {
  CommandEnvelope,
  CommandKind,
  CommandResult,
  EffectTag,
  HouseholdRole,
  LedgerScope,
  Precondition,
} from "@trove/protocol";
import { isCommandKind, resolveCommandScope } from "@trove/protocol";
import { ORPCError } from "@orpc/server";

import { commandResult, householdChange } from "@trove/db/schema/commands";

import { findActiveMembership } from "../membership/access";
import { can, requiredCapability } from "./capabilities";
import { COMMAND_HANDLERS, type CommandHandler } from "./handlers";
import {
  bindLedgerScope,
  ensurePersonalLedger,
  ensureUserProjection,
  type CommandActor,
  type ScopeBinding,
} from "./scope";
import {
  assertionStatement,
  changeLogStatement,
  executeLedgerTransaction,
  resultStatement,
  type BatchStatement,
} from "./statements";
import type { CommandDatabase } from "./types";

/** Everything a handler needs to read current state and plan writes. */
export interface PlanContext {
  db: CommandDatabase;
  /** Owning Ledger — the scope every ledger row is filtered and written by. */
  ledgerId: string;
  scope: LedgerScope;
  /** Household backing an organization Ledger; null for a Personal Ledger. */
  householdId: string | null;
  actorUserId: string;
  actorRole: HouseholdRole;
}

/**
 * A {@link PlanContext} narrowed to the organization path. Handlers that read
 * or write Household-owned tables (memberships, import) declare this context
 * and the pipeline never dispatches them under a Personal Ledger.
 */
export interface HouseholdPlanContext extends PlanContext {
  householdId: string;
}

export interface PlanRequest {
  payload: unknown;
  preconditions: readonly Precondition[];
}

/**
 * A validated plan: pure derived data plus driver-agnostic SQL statements.
 * The pipeline wraps it in one atomic batch together with the change-log
 * append and the idempotency record — partial application is never observable.
 */
export interface CommandPlan {
  readonly effects: readonly EffectTag[];
  readonly applied: unknown;
  /** Writes to apply as query-builder statements. */
  readonly statements: readonly BatchStatement[];
  /** Existence/version guard expressions re-validated inside the batch as failing assertions. */
  readonly guards: readonly SQL[];
}

/** Rejections decidable from state before the batch runs. */
export type PlanRejection = Extract<
  CommandResult,
  { kind: "forbidden" | "invalid_intent" | "missing_entity" | "stale_version" | "conflict" }
>;

export function isPlanRejection(value: CommandPlan | PlanRejection): value is PlanRejection {
  return !("statements" in value);
}

export type ApplyCommandEnvelope = Omit<CommandEnvelope, "kind"> & {
  readonly kind: string;
};

export interface ApplyCommandArgs {
  db: CommandDatabase;
  userId: string;
  envelope: ApplyCommandEnvelope;
  /**
   * Verified WorkOS claims for the caller. Supplied by the router so a first
   * personal write can project the identity it attributes rows to.
   */
  actor?: CommandActor;
}

function unknownKindRejection(kind: string): PlanRejection {
  return {
    kind: "invalid_intent",
    issues: [
      {
        field: "kind",
        message: `Unknown or unsupported command kind "${kind}".`,
      },
    ],
  };
}

function unscopedRejection(): PlanRejection {
  return {
    kind: "invalid_intent",
    issues: [
      {
        field: "scope",
        message: "Name the ledger this command writes to: a personal or organization scope.",
      },
    ],
  };
}

function personalUnsupportedRejection(kind: CommandKind): PlanRejection {
  return {
    kind: "invalid_intent",
    issues: [
      {
        field: "scope",
        message: `"${kind}" needs a Household; a personal ledger does not include membership or import.`,
      },
    ],
  };
}

type ScopeAuthorization =
  | { readonly rejected: PlanRejection }
  | {
      readonly rejected?: undefined;
      readonly scope: LedgerScope;
      readonly binding: ScopeBinding;
      readonly actorRole: HouseholdRole;
    };

/**
 * Resolves the envelope's Ledger Scope and authorizes the caller against it.
 *
 * Personal: the scope is bound to the authenticated User by construction, so
 * there is no membership to check and no way to address someone else's ledger.
 * Organization: live membership decides, as a typed rejection rather than an
 * HTTP error, so clients can render the Rejected Changes inbox.
 */
async function authorizeEnvelope(
  db: CommandDatabase,
  envelope: ApplyCommandEnvelope,
  userId: string,
): Promise<ScopeAuthorization> {
  const scope = resolveCommandScope(envelope, userId);
  if (!scope) {
    return { rejected: unscopedRejection() };
  }
  const binding = bindLedgerScope(scope);
  if (scope.type === "personal") {
    // The owner of a Personal Ledger holds every capability over it.
    return { scope, binding, actorRole: "admin" };
  }
  const actorMembership = await findActiveMembership(db, userId, scope.organizationId);
  if (!actorMembership) {
    return {
      rejected: {
        kind: "forbidden",
        role: null,
        requiredCapability: requiredCapability(envelope.kind),
      },
    };
  }
  return { scope, binding, actorRole: actorMembership.role };
}

/** A Personal Ledger is provisioned by its owner's first write, not up front. */
async function provisionPersonalLedger(
  db: CommandDatabase,
  userId: string,
  actor: CommandActor | undefined,
): Promise<void> {
  if (actor) await ensureUserProjection(db, actor);
  await ensurePersonalLedger(db, userId);
}

/**
 * Predicate preconditions are evaluated by their handler inside the batch
 * guard; anything the handler does not declare is rejected loudly rather than
 * silently granting no guard.
 */
function unsupportedPredicateRejection(
  handler: CommandHandler,
  preconditions: readonly Precondition[],
): PlanRejection | null {
  const supported = handler.supportedPredicates ?? [];
  const unsupported = preconditions.filter(
    (p) => p.predicate !== undefined && !supported.includes(p.predicate),
  );
  if (unsupported.length === 0) return null;
  return {
    kind: "invalid_intent",
    issues: unsupported.map((p) => ({
      field: "preconditions",
      message: `Predicate precondition "${p.predicate ?? ""}" is not supported yet; only expectedVersion is validated.`,
    })),
  };
}

/**
 * The commands pipeline: scope resolution → authorization → idempotency →
 * parse → plan → one atomic batch (guards, apply, recompute inputs,
 * change-log append, idempotency store) → discriminated result.
 */
export async function applyCommand({
  db,
  userId,
  envelope,
  actor,
}: ApplyCommandArgs): Promise<CommandResult> {
  const rawKind = envelope.kind;

  // 1. Resolve the Ledger Scope and authorize against it. A personal envelope
  //    binds to the caller, so it can never name another User's ledger.
  const authorization = await authorizeEnvelope(db, envelope, userId);
  if (authorization.rejected) {
    return authorization.rejected;
  }
  const { scope, binding, actorRole } = authorization;
  const { ledgerId, householdId } = binding;

  // Removed / unknown kinds must be typed rejections (outbox drain), not
  // Zod 400s or capability-matrix crashes.
  if (!isCommandKind(rawKind)) {
    return unknownKindRejection(rawKind);
  }
  const kind: CommandKind = rawKind;
  if (!can(actorRole, kind)) {
    return { kind: "forbidden", role: actorRole, requiredCapability: requiredCapability(kind) };
  }

  // 3. Parse the kind-specific payload.
  const handler: CommandHandler | undefined = COMMAND_HANDLERS[kind];
  if (!handler) {
    return unknownKindRejection(kind);
  }
  if (scope.type === "personal") {
    // Household-owned intents (membership, import) have no meaning without a
    // Household. Reject them loudly instead of writing rows a Personal Ledger
    // can never read back.
    if (handler.supportsPersonalScope !== true) {
      return personalUnsupportedRejection(kind);
    }
    await provisionPersonalLedger(db, userId, actor);
  }

  // 2. Idempotency: a retry replays the stored result instead of re-executing.
  const storedRows = await db
    .select()
    .from(commandResult)
    .where(
      and(eq(commandResult.ledgerId, ledgerId), eq(commandResult.commandId, envelope.commandId)),
    )
    .limit(1);
  const stored = storedRows[0];
  if (stored) {
    const replay = await loadAppliedResult(db, ledgerId, envelope.commandId, stored.result, true);
    if (replay) {
      return replay;
    }
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message:
        "Idempotency store has a result without a matching change row. Verify the household_changes table.",
    });
  }
  const parsed = handler.parsePayload(envelope.payload);
  if (!parsed.ok) {
    return { kind: "invalid_intent", issues: parsed.issues };
  }

  const preconditions = envelope.preconditions ?? [];
  const unsupported = unsupportedPredicateRejection(handler, preconditions);
  if (unsupported) {
    return unsupported;
  }

  // 4. Plan via pure domain rules over current state.
  const planContext: PlanContext = {
    db,
    ledgerId,
    scope,
    householdId,
    actorUserId: userId,
    actorRole,
  };
  const request: PlanRequest = { payload: parsed.value, preconditions };
  const outcome = await handler.plan(planContext, request);
  if (isPlanRejection(outcome)) {
    return outcome;
  }

  // 5. Commit everything in one atomic batch: guards abort the whole batch on
  //    failure, so stale versions can never partially apply.
  const statements = [
    ...outcome.guards.map((guard) => assertionStatement(db, guard)),
    ...outcome.statements,
    changeLogStatement(db, {
      ledgerId,
      householdId,
      userId,
      commandId: envelope.commandId,
      effects: outcome.effects,
    }),
    resultStatement(db, {
      ledgerId,
      householdId,
      commandId: envelope.commandId,
      result: outcome.applied,
    }),
  ];
  try {
    await executeLedgerTransaction(db, statements, ledgerId, {
      lockLedger: kind !== "transaction.create",
    });
  } catch (error) {
    // Concurrent duplicate: another writer committed this exact commandId
    // between our idempotency read and this batch — replay their result.
    const racedRows = await db
      .select()
      .from(commandResult)
      .where(
        and(eq(commandResult.ledgerId, ledgerId), eq(commandResult.commandId, envelope.commandId)),
      )
      .limit(1)
      .catch(() => []);
    const raced = racedRows[0];
    if (raced) {
      const replay = await loadAppliedResult(db, ledgerId, envelope.commandId, raced.result, true);
      if (replay) {
        return replay;
      }
    }

    // A guard fired between planning and commit — re-plan once against the
    // now-current state to surface the precise typed rejection.
    const rePlan = await handler.plan(planContext, request).catch(() => null);
    if (rePlan && isPlanRejection(rePlan)) {
      return rePlan;
    }
    console.error("commands.apply: atomic batch failed", {
      commandId: envelope.commandId,
      ledgerId,
      kind,
    });
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "The command could not be committed atomically. Retry with the same commandId.",
      cause: error,
    });
  }

  // 6. Return the recomputed state with the allocated sequence number.
  const applied = await loadAppliedResult(db, ledgerId, envelope.commandId, outcome.applied, false);
  if (!applied) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Command committed but no change row was appended. Verify the batch statements.",
    });
  }
  return applied;
}

async function loadAppliedResult(
  db: CommandDatabase,
  ledgerId: string,
  commandId: string,
  appliedPayload: unknown,
  replayed: boolean,
): Promise<Extract<CommandResult, { kind: "applied" }> | null> {
  const changeRows = await db
    .select()
    .from(householdChange)
    .where(and(eq(householdChange.ledgerId, ledgerId), eq(householdChange.commandId, commandId)))
    .limit(1);
  const change = changeRows[0];
  if (!change) {
    return null;
  }
  return {
    kind: "applied",
    seq: change.seq,
    effects: change.effects,
    applied: appliedPayload,
    replayed,
  };
}
