import type { CommandResult } from "@trove/protocol";

/**
 * Client-side mirror of the typed-rejection union returned by the
 * `commands.apply` oRPC mutation (`packages/api/src/lib/commands/pipeline.ts`
 * → `CommandResult`). Every non-`applied` variant is a rejection the Rejected
 * Changes inbox (#94) can render without string parsing.
 */
export const REJECTION_KINDS = [
  "stale_version",
  "invalid_intent",
  "preview_required",
  "missing_entity",
  "forbidden",
  "conflict",
] as const;

export type RejectionKind = (typeof REJECTION_KINDS)[number];

export type RejectionResult = Extract<CommandResult, { kind: RejectionKind }>;

const REJECTION_KIND_SET: ReadonlySet<string> = new Set(REJECTION_KINDS);

export function isRejectionKind(value: unknown): value is RejectionKind {
  return typeof value === "string" && REJECTION_KIND_SET.has(value);
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function toFiniteNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toStringOr(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function toIssues(value: unknown): { field: string; message: string }[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((issue) => {
    const record = toRecord(issue);
    return {
      field: toStringOr(record?.field, "unknown"),
      message: toStringOr(record?.message, "This value was rejected."),
    };
  });
}

/**
 * Normalizes a stored rejection payload into the typed union. Anything that
 * does not match a known shape degrades to an explicit `conflict` marker so
 * the inbox always has a renderable reason instead of crashing on bad data.
 */
export function parseRejection(value: unknown): RejectionResult {
  const record = toRecord(value);
  if (!record) {
    return { kind: "conflict", reason: "unknown_rejection_shape" };
  }
  switch (record.kind) {
    case "stale_version":
      return {
        kind: "stale_version",
        entityId: toStringOr(record.entityId, "unknown"),
        expectedVersion: toFiniteNumber(record.expectedVersion),
        actualVersion: toFiniteNumber(record.actualVersion),
      };
    case "invalid_intent":
    case "preview_required":
      return { kind: record.kind, issues: toIssues(record.issues) };
    case "missing_entity":
      return {
        kind: "missing_entity",
        entityType: toStringOr(record.entityType, "entity"),
        entityId: toStringOr(record.entityId, "unknown"),
      };
    case "forbidden":
      return {
        kind: "forbidden",
        role:
          record.role === "admin" || record.role === "member" || record.role === "viewer"
            ? record.role
            : null,
        requiredCapability: toStringOr(record.requiredCapability, "unknown capability"),
      };
    case "conflict":
      return {
        kind: "conflict",
        reason: toStringOr(record.reason, "unknown"),
        current: toRecord(record.current) ?? undefined,
      };
    default:
      return { kind: "conflict", reason: "unknown_rejection_shape" };
  }
}

/** Human-readable rejection reason for inbox entries. */
export function describeRejection(rejection: RejectionResult): string {
  switch (rejection.kind) {
    case "stale_version":
      return `Changed elsewhere since you drafted this (version ${rejection.expectedVersion} → ${rejection.actualVersion}). Review and resubmit.`;
    case "invalid_intent":
      return rejection.issues.length > 0
        ? rejection.issues.map((issue) => `${issue.field}: ${issue.message}`).join(" · ")
        : "Some values in this change were not valid.";
    case "preview_required":
      return rejection.issues.length > 0
        ? `Needs review before applying — ${rejection.issues.map((i) => i.message).join("; ")}`
        : "Needs review before it can be applied.";
    case "missing_entity":
      return `This ${rejection.entityType} no longer exists.`;
    case "forbidden":
      return rejection.role
        ? `Your role (${rejection.role}) cannot do this — requires ${rejection.requiredCapability}.`
        : `You no longer have access — requires ${rejection.requiredCapability}.`;
    case "conflict":
      return `Conflicts with a recent change (${rejection.reason}).`;
  }
}
