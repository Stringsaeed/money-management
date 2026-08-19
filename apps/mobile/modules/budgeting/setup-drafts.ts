import type { SQLiteDatabase } from "expo-sqlite";

import type {
  CreateSetupDraftRequest,
  SetupDraft,
  SetupDraftEnvelope,
  SetupDraftPrerequisites,
} from "./setup-draft-types";
import { GUIDED_SETUP_DRAFT_ID } from "./setup-draft-types";
import { getSetupDraftPrerequisites } from "./setup-draft-suggestions";
import { validateSetupDraft } from "./setup-draft-validation";
import { requireCurrency } from "./validation";

interface SetupDraftRow {
  payload: string;
}

export async function createSetupDraft(
  database: SQLiteDatabase,
  request: CreateSetupDraftRequest,
): Promise<SetupDraft> {
  const prerequisites = await getSetupDraftPrerequisites(database);
  const currencies = requireSetupCurrencies(request.currencies, prerequisites);
  const primaryCurrency = currencies[0];
  const draft: SetupDraft = {
    version: 1,
    id: request.id ?? GUIDED_SETUP_DRAFT_ID,
    mode: request.mode,
    step: "plan",
    workspaces: currencies.map((currency) => ({
      currency,
      fundingAccountIds: prerequisites.fundingAccounts
        .filter((account) => account.currency === currency)
        .map(({ id }) => id),
      envelopes:
        request.mode === "suggested" && currency === primaryCurrency
          ? prerequisites.categories.map((category, index) => ({
              id: `draft-envelope-${index + 1}-${category.id}`,
              currency,
              name: category.name,
              icon: category.icon,
              color: category.color,
              categoryIds: [category.id],
              positiveRollover: true,
              initialAssignmentMinor: 0,
            }))
          : [],
    })),
    createdAt: request.now,
    updatedAt: request.now,
  };
  await saveSetupDraft(database, draft, request.now);
  return draft;
}

export async function loadSetupDraft(
  database: SQLiteDatabase,
  id = GUIDED_SETUP_DRAFT_ID,
): Promise<SetupDraft | null> {
  const row = await database.getFirstAsync<SetupDraftRow>(
    "SELECT payload FROM setup_drafts WHERE id = ?",
    id,
  );
  if (!row) return null;
  try {
    return JSON.parse(row.payload) as SetupDraft;
  } catch {
    throw new Error("The saved Setup Draft is unreadable. Discard it and start again.");
  }
}

export async function saveSetupDraft(
  database: SQLiteDatabase,
  draft: SetupDraft,
  now: string,
): Promise<SetupDraft> {
  const next = { ...draft, updatedAt: now };
  await validateSetupDraft(database, next);
  await database.runAsync(
    `INSERT INTO setup_drafts (id, payload, created_at, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
    next.id,
    JSON.stringify(next),
    next.createdAt,
    next.updatedAt,
  );
  return next;
}

export async function discardSetupDraft(
  database: SQLiteDatabase,
  id = GUIDED_SETUP_DRAFT_ID,
): Promise<void> {
  await database.runAsync("DELETE FROM setup_drafts WHERE id = ?", id);
}

export function mergeSetupDraftEnvelopes(
  draft: SetupDraft,
  currency: string,
  envelopeIds: readonly string[],
): SetupDraft {
  if (new Set(envelopeIds).size < 2) {
    throw new Error("Select at least two distinct Envelope suggestions to merge.");
  }
  const workspace = draft.workspaces.find((candidate) => candidate.currency === currency);
  const selected = workspace?.envelopes.filter(({ id }) => envelopeIds.includes(id)) ?? [];
  if (!workspace || selected.length !== envelopeIds.length) {
    throw new Error(`Every merged Envelope must belong to the ${currency} Setup Draft.`);
  }
  const [target, ...merged] = selected;
  if (!target) throw new Error("A merge target is required.");
  const mergedIds = new Set(merged.map(({ id }) => id));
  return updateWorkspace(draft, currency, {
    ...workspace,
    envelopes: workspace.envelopes
      .filter(({ id }) => !mergedIds.has(id))
      .map((envelope) =>
        envelope.id === target.id
          ? {
              ...envelope,
              categoryIds: selected.flatMap(({ categoryIds }) => categoryIds),
              initialAssignmentMinor: selected.reduce(
                (total, item) => total + item.initialAssignmentMinor,
                0,
              ),
            }
          : envelope,
      ),
  });
}

export function updateSetupDraftEnvelope(
  draft: SetupDraft,
  currency: string,
  envelopeId: string,
  changes: Partial<
    Pick<
      SetupDraftEnvelope,
      "name" | "icon" | "color" | "categoryIds" | "positiveRollover" | "initialAssignmentMinor"
    >
  >,
): SetupDraft {
  const workspace = draft.workspaces.find((candidate) => candidate.currency === currency);
  if (!workspace || !workspace.envelopes.some(({ id }) => id === envelopeId)) {
    throw new Error(`Envelope ${envelopeId} does not belong to the ${currency} Setup Draft.`);
  }
  return updateWorkspace(draft, currency, {
    ...workspace,
    envelopes: workspace.envelopes.map((envelope) =>
      envelope.id === envelopeId ? { ...envelope, ...changes } : envelope,
    ),
  });
}

export function updateSetupDraftFundingAccounts(
  draft: SetupDraft,
  currency: string,
  fundingAccountIds: readonly string[],
): SetupDraft {
  const workspace = draft.workspaces.find((candidate) => candidate.currency === currency);
  if (!workspace) throw new Error(`${currency} is not part of this Setup Draft.`);
  return updateWorkspace(draft, currency, {
    ...workspace,
    fundingAccountIds: [...fundingAccountIds],
  });
}

export function moveSetupDraftCategory(
  draft: SetupDraft,
  currency: string,
  categoryId: string,
  envelopeId: string,
): SetupDraft {
  const workspace = draft.workspaces.find((candidate) => candidate.currency === currency);
  if (!workspace?.envelopes.some(({ id }) => id === envelopeId)) {
    throw new Error(`Envelope ${envelopeId} does not belong to the ${currency} Setup Draft.`);
  }
  return {
    ...draft,
    workspaces: draft.workspaces.map((candidate) => ({
      ...candidate,
      envelopes: candidate.envelopes.map((envelope) => ({
        ...envelope,
        categoryIds:
          envelope.id === envelopeId
            ? [...envelope.categoryIds.filter((id) => id !== categoryId), categoryId]
            : envelope.categoryIds.filter((id) => id !== categoryId),
      })),
    })),
  };
}

function updateWorkspace(
  draft: SetupDraft,
  currency: string,
  workspace: SetupDraft["workspaces"][number],
): SetupDraft {
  return {
    ...draft,
    workspaces: draft.workspaces.map((candidate) =>
      candidate.currency === currency ? workspace : candidate,
    ),
  };
}

function requireSetupCurrencies(
  requested: readonly string[],
  prerequisites: SetupDraftPrerequisites,
): string[] {
  const currencies = requested.map(requireCurrency);
  if (currencies.length === 0 || new Set(currencies).size !== currencies.length) {
    throw new Error("Setup Draft currencies must be distinct and non-empty.");
  }
  for (const currency of currencies) {
    if (!prerequisites.currencies.includes(currency)) {
      throw new Error(`${currency} needs an eligible Funding Account before setup can begin.`);
    }
  }
  return currencies;
}
