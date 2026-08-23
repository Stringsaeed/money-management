import type { SetupDraft, SetupDraftEnvelope, SetupDraftWorkspace } from "./setup-draft-types";
import { GUIDED_SETUP_DRAFT_ID } from "./setup-draft-types";

export class UnreadableSetupDraftError extends Error {
  constructor() {
    super("The saved Setup Draft is unreadable. Discard it and start again.");
    this.name = "UnreadableSetupDraftError";
  }
}

export function decodeSetupDraft(value: unknown): SetupDraft {
  if (!isRecord(value)) return unreadable();
  if (
    value.version !== 1 ||
    value.id !== GUIDED_SETUP_DRAFT_ID ||
    (value.mode !== "suggested" && value.mode !== "blank") ||
    (value.step !== "plan" && value.step !== "review") ||
    !isString(value.createdAt) ||
    !isString(value.updatedAt) ||
    !Array.isArray(value.workspaces)
  ) {
    return unreadable();
  }
  return {
    version: 1,
    id: GUIDED_SETUP_DRAFT_ID,
    mode: value.mode,
    step: value.step,
    workspaces: value.workspaces.map(decodeWorkspace),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function decodeWorkspace(value: unknown): SetupDraftWorkspace {
  if (
    !isRecord(value) ||
    !isString(value.currency) ||
    !isStringArray(value.fundingAccountIds) ||
    !Array.isArray(value.envelopes)
  ) {
    return unreadable();
  }
  return {
    currency: value.currency,
    fundingAccountIds: value.fundingAccountIds,
    envelopes: value.envelopes.map(decodeEnvelope),
  };
}

function decodeEnvelope(value: unknown): SetupDraftEnvelope {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.currency) ||
    !isString(value.name) ||
    !isString(value.icon) ||
    !isString(value.color) ||
    !isStringArray(value.categoryIds) ||
    typeof value.positiveRollover !== "boolean" ||
    typeof value.initialAssignmentMinor !== "number" ||
    !Number.isSafeInteger(value.initialAssignmentMinor)
  ) {
    return unreadable();
  }
  return {
    id: value.id,
    currency: value.currency,
    name: value.name,
    icon: value.icon,
    color: value.color,
    categoryIds: value.categoryIds,
    positiveRollover: value.positiveRollover,
    initialAssignmentMinor: value.initialAssignmentMinor,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function unreadable(): never {
  throw new UnreadableSetupDraftError();
}
