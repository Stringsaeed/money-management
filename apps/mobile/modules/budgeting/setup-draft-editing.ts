import type { SetupDraft, SetupDraftEnvelope } from "./setup-draft-types";

export interface AddSetupDraftEnvelopeInput {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export function addSetupDraftEnvelope(
  draft: SetupDraft,
  currency: string,
  input: AddSetupDraftEnvelopeInput,
): SetupDraft {
  const workspace = requireWorkspace(draft, currency);
  return updateWorkspace(draft, currency, {
    ...workspace,
    envelopes: [
      ...workspace.envelopes,
      {
        ...input,
        currency,
        categoryIds: [],
        positiveRollover: true,
        initialAssignmentMinor: 0,
      },
    ],
  });
}

export function mergeSetupDraftEnvelopes(
  draft: SetupDraft,
  currency: string,
  envelopeIds: readonly string[],
): SetupDraft {
  if (new Set(envelopeIds).size < 2) {
    throw new Error("Select at least two distinct Envelope suggestions, then try the merge again.");
  }
  const workspace = requireWorkspace(draft, currency);
  const envelopeById = new Map(workspace.envelopes.map((envelope) => [envelope.id, envelope]));
  const selected = envelopeIds.map((id) => envelopeById.get(id));
  if (selected.some((envelope) => !envelope)) {
    throw new Error(`Every merged Envelope must belong to ${currency}. Review the selection.`);
  }
  const selectedEnvelopes = selected as [SetupDraftEnvelope, ...SetupDraftEnvelope[]];
  const [target, ...merged] = selectedEnvelopes;
  const mergedIds = new Set(merged.map(({ id }) => id));
  return updateWorkspace(draft, currency, {
    ...workspace,
    envelopes: workspace.envelopes
      .filter(({ id }) => !mergedIds.has(id))
      .map((envelope) =>
        envelope.id === target.id
          ? {
              ...envelope,
              categoryIds: selectedEnvelopes.flatMap(({ categoryIds }) => categoryIds),
              initialAssignmentMinor: selectedEnvelopes.reduce(
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
  const workspace = requireWorkspace(draft, currency);
  if (!workspace.envelopes.some(({ id }) => id === envelopeId)) {
    throw new Error(`Envelope ${envelopeId} is no longer in ${currency}. Reload the Setup Draft.`);
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
  const workspace = requireWorkspace(draft, currency);
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
  const workspace = requireWorkspace(draft, currency);
  if (!workspace.envelopes.some(({ id }) => id === envelopeId)) {
    throw new Error(`Envelope ${envelopeId} is no longer in ${currency}. Reload the Setup Draft.`);
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

function requireWorkspace(draft: SetupDraft, currency: string): SetupDraft["workspaces"][number] {
  const workspace = draft.workspaces.find((candidate) => candidate.currency === currency);
  if (!workspace) throw new Error(`${currency} is not in this Setup Draft. Reload and try again.`);
  return workspace;
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
