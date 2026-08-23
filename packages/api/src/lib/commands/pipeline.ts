import type { SQL } from "drizzle-orm";
import { and, eq } from "drizzle-orm";
import type {
  CommandEnvelope,
  CommandResult,
  EffectTag,
  HouseholdRole,
  Precondition,
} from "@trove/protocol";
import { ORPCError } from "@orpc/server";

import { commandResult, householdChange } from "@trove/db/schema/commands";
import { membership } from "@trove/db/schema/household";

import { can, requiredCapability } from "./capabilities";
import { COMMAND_HANDLERS, type CommandHandler } from "./handlers";
import {
  assertionStatement,
  changeLogStatement,
  executeBatch,
  resultStatement,
  type BatchStatement,
} from "./statements";
import type { CommandDatabase } from "./types";

/** Everything a handler needs to read current state and plan writes. */
export interface PlanContext {
  db: CommandDatabase;
  householdId: string;
  actorUserId: string;
  actorRole: HouseholdRole;
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
  { kind: "invalid_intent" | "missing_entity" | "stale_version" | "conflict" }
>;

export function isPlanRejection(value: CommandPlan | PlanRejection): value is PlanRejection {
  return !("statements" in value);
}

export interface ApplyCommandArgs {
  db: CommandDatabase;
  userId: string;
  envelope: CommandEnvelope;
}

/**
 * The commands pipeline: authorization → idempotency → parse → plan → one
 * atomic batch (guards, apply, recompute inputs, change-log append,
 * idempotency store) → discriminated result.
 */
export async function applyCommand({
  db,
  userId,
  envelope,
}: ApplyCommandArgs): Promise<CommandResult> {
  const kind = envelope.kind;

  // 1. Authorization against live membership — a typed rejection, not an
  //    HTTP error, so clients can render the Rejected Changes inbox.
  const membershipRows = await db
    .select()
    .from(membership)
    .where(and(eq(membership.userId, userId), eq(membership.householdId, envelope.householdId)))
    .limit(1);
  const actorMembership = membershipRows[0];
  if (!actorMembership) {
    return { kind: "forbidden", role: null, requiredCapability: requiredCapability(kind) };
  }
  const actorRole = actorMembership.role as HouseholdRole;
  if (!can(actorRole, kind)) {
    return { kind: "forbidden", role: actorRole, requiredCapability: requiredCapability(kind) };
  }

  // 2. Idempotency: a retry replays the stored result instead of re-executing.
  const storedRows = await db
    .select()
    .from(commandResult)
    .where(
      and(
        eq(commandResult.householdId, envelope.householdId),
        eq(commandResult.commandId, envelope.commandId),
      ),
    )
    .limit(1);
  const stored = storedRows[0];
  if (stored) {
    const replay = await loadAppliedResult(
      db,
      envelope.householdId,
      envelope.commandId,
      stored.result,
      true,
    );
    if (replay) {
      return replay;
    }
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message:
        "Idempotency store has a result without a matching change row. Verify the household_changes table.",
    });
  }

  // 3. Parse the kind-specific payload.
  const handler: CommandHandler | undefined = COMMAND_HANDLERS[kind];
  if (!handler) {
    throw new ORPCError("NOT_IMPLEMENTED", {
      message: `Command kind "${kind}" has no registered handler yet.`,
    });
  }
  const parsed = handler.parsePayload(envelope.payload);
  if (!parsed.ok) {
    return { kind: "invalid_intent", issues: parsed.issues };
  }

  // 4. Plan via pure domain rules over current state.
  const planContext: PlanContext = {
    db,
    householdId: envelope.householdId,
    actorUserId: userId,
    actorRole,
  };
  const request: PlanRequest = {
    payload: parsed.value,
    preconditions: envelope.preconditions ?? [],
  };
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
      householdId: envelope.householdId,
      userId,
      commandId: envelope.commandId,
      effects: outcome.effects,
    }),
    resultStatement(db, {
      householdId: envelope.householdId,
      commandId: envelope.commandId,
      result: outcome.applied,
    }),
  ];
  try {
    await executeBatch(db, statements);
  } catch (error) {
    // A guard fired between planning and commit — re-plan once against the
    // now-current state to surface the precise typed rejection.
    const rePlan = await handler.plan(planContext, request).catch(() => null);
    if (rePlan && isPlanRejection(rePlan)) {
      return rePlan;
    }
    console.error("commands.apply: atomic batch failed", {
      commandId: envelope.commandId,
      householdId: envelope.householdId,
      kind,
    });
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "The command could not be committed atomically. Retry with the same commandId.",
      cause: error,
    });
  }

  // 6. Return the recomputed state with the allocated sequence number.
  const applied = await loadAppliedResult(
    db,
    envelope.householdId,
    envelope.commandId,
    outcome.applied,
    false,
  );
  if (!applied) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Command committed but no change row was appended. Verify the batch statements.",
    });
  }
  return applied;
}

async function loadAppliedResult(
  db: CommandDatabase,
  householdId: string,
  commandId: string,
  appliedPayload: unknown,
  replayed: boolean,
): Promise<Extract<CommandResult, { kind: "applied" }> | null> {
  const changeRows = await db
    .select()
    .from(householdChange)
    .where(
      and(eq(householdChange.householdId, householdId), eq(householdChange.commandId, commandId)),
    )
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
