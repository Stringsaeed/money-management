import type { SQLiteDatabase } from "expo-sqlite";

import { loadAccountBalances } from "@/modules/accounts/account-balance";

import type { SetupDraft, SetupDraftEnvelope } from "./setup-draft-types";
import { addMoney, requireCurrency, requireMinorUnits } from "./validation";

const ELIGIBLE_FUNDING_TYPES = new Set(["checking", "savings", "cash"]);

export async function validateSetupDraft(
  database: SQLiteDatabase,
  draft: SetupDraft,
): Promise<void> {
  requireDraftShape(draft);
  const accounts = await loadAccountBalances(database, true);
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const mappedCategoryIds = new Set<string>();
  const envelopeIds = new Set<string>();

  for (const workspace of draft.workspaces) {
    const currency = requireCurrency(workspace.currency);
    let assignableMinor = 0;
    for (const accountId of workspace.fundingAccountIds) {
      const account = accountById.get(accountId);
      if (!account || account.lifecycle !== "active" || !ELIGIBLE_FUNDING_TYPES.has(account.type)) {
        throw new Error(`Account ${accountId} is not eligible for a Setup Draft Funding plan.`);
      }
      if (account.currency !== currency) {
        throw new Error(
          `Cannot plan ${currency} Funding with Account ${accountId} in ${account.currency}.`,
        );
      }
      assignableMinor = addMoney(assignableMinor, account.balance, currency);
    }

    let assignedMinor = 0;
    for (const envelope of workspace.envelopes) {
      requireEnvelopeFields(envelope, currency, envelopeIds);
      assignedMinor = addMoney(assignedMinor, envelope.initialAssignmentMinor, currency);
      for (const categoryId of envelope.categoryIds) {
        if (!categoryId.trim() || mappedCategoryIds.has(categoryId)) {
          throw new Error(`Category ${categoryId || "Mapping"} may appear in only one Envelope.`);
        }
        mappedCategoryIds.add(categoryId);
        await requireCategoryMapping(database, categoryId, currency);
      }
    }
    if (assignedMinor > Math.max(assignableMinor, 0)) {
      throw new Error(
        `${currency} initial Assignments cannot exceed the selected Funding Account balance.`,
      );
    }
  }
}

function requireDraftShape(draft: SetupDraft): void {
  if (draft.version !== 1 || !draft.id.trim()) {
    throw new Error("Setup Draft has an unsupported or missing identity.");
  }
  const currencies = draft.workspaces.map(({ currency }) => requireCurrency(currency));
  if (new Set(currencies).size !== currencies.length) {
    throw new Error("A Setup Draft may contain only one workspace per currency.");
  }
}

function requireEnvelopeFields(
  envelope: SetupDraftEnvelope,
  currency: string,
  envelopeIds: Set<string>,
): void {
  if (!envelope.id.trim() || envelopeIds.has(envelope.id)) {
    throw new Error("Setup Draft Envelope IDs must be distinct and non-empty.");
  }
  envelopeIds.add(envelope.id);
  if (envelope.currency !== currency) {
    throw new Error(
      `Envelope ${envelope.id} uses ${envelope.currency}, not workspace currency ${currency}.`,
    );
  }
  if (!envelope.name.trim() || !envelope.icon.trim() || !envelope.color.trim()) {
    throw new Error(`Envelope ${envelope.id} requires a name, emoji, and color.`);
  }
  requireMinorUnits(envelope.initialAssignmentMinor, currency);
  if (envelope.initialAssignmentMinor < 0) {
    throw new Error("Initial Assignments cannot be negative.");
  }
}

async function requireCategoryMapping(
  database: SQLiteDatabase,
  categoryId: string,
  currency: string,
): Promise<void> {
  const category = await database.getFirstAsync<{ id: string }>(
    `SELECT id FROM categories
     WHERE id = ? AND lifecycle = 'active' AND type = 'expense'`,
    categoryId,
  );
  if (!category) {
    throw new Error(`Only active expense Categories can appear in a Setup Draft.`);
  }
  const incompatible = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM transactions
     WHERE category_id = ? AND currency <> ?`,
    categoryId,
    currency,
  );
  if ((incompatible?.count ?? 0) > 0) {
    throw new Error(`Category ${categoryId} cannot map to a cross-currency Envelope.`);
  }
}
