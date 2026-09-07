import type { SQLiteDatabase } from "@/db/sqlite";

import { loadAccountBalances } from "@/modules/accounts/account-balance";

import { isEligibleFundingAccountType } from "./funding-account-eligibility";
import {
  calculateFundingPoolThroughPeriod,
  type FundingPoolAccount,
} from "./funding-pool-calculation";
import type {
  SetupDraft,
  SetupDraftEnvelope,
  SetupDraftValidationContext,
} from "./setup-draft-types";
import { GUIDED_SETUP_DRAFT_ID } from "./setup-draft-types";
import { addMoney, periodForLocalDate, requireCurrency, requireMinorUnits } from "./validation";

export async function validateSetupDraft(
  database: SQLiteDatabase,
  draft: SetupDraft,
  context: SetupDraftValidationContext,
): Promise<void> {
  requireDraftShape(draft);
  const period = periodForLocalDate(context.localDate);
  const accounts = await loadAccountBalances(database, true);
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const mappedCategoryIds = new Set<string>();
  const envelopeIds = new Set<string>();
  const requestedCategoryIds = draft.workspaces.flatMap(({ envelopes }) =>
    envelopes.flatMap(({ categoryIds }) => categoryIds),
  );
  const eligibleCategoryIds = await getEligibleCategoryIds(database, requestedCategoryIds);

  for (const workspace of draft.workspaces) {
    const currency = requireCurrency(workspace.currency);
    if (new Set(workspace.fundingAccountIds).size !== workspace.fundingAccountIds.length) {
      throw new Error(
        `${currency} Setup Draft Funding Accounts must be distinct. Remove the duplicate Account.`,
      );
    }
    const fundingAccounts: FundingPoolAccount[] = [];
    for (const accountId of workspace.fundingAccountIds) {
      const account = accountById.get(accountId);
      if (
        !account ||
        account.lifecycle !== "active" ||
        !isEligibleFundingAccountType(account.type)
      ) {
        throw new Error(
          `Account ${accountId} cannot fund this Setup Draft. Choose an active eligible Account.`,
        );
      }
      if (account.currency !== currency) {
        throw new Error(
          `Cannot plan ${currency} Funding with Account ${accountId} in ${account.currency}.`,
        );
      }
      fundingAccounts.push({
        id: account.id,
        currency: account.currency,
        initialBalance: account.initialBalance,
      });
    }

    let assignedMinor = 0;
    for (const envelope of workspace.envelopes) {
      requireEnvelopeFields(envelope, currency, envelopeIds);
      assignedMinor = addMoney(assignedMinor, envelope.initialAssignmentMinor, currency);
      for (const categoryId of envelope.categoryIds) {
        if (!categoryId.trim() || mappedCategoryIds.has(categoryId)) {
          throw new Error(
            `Category ${categoryId || "Mapping"} may appear in only one Envelope. Choose the single Envelope that should own it.`,
          );
        }
        mappedCategoryIds.add(categoryId);
        if (!eligibleCategoryIds.has(categoryId)) {
          throw new Error(
            `Category ${categoryId} cannot be mapped. Choose an active expense Category.`,
          );
        }
      }
    }
    const { amountMinor: assignableMinor } = await calculateFundingPoolThroughPeriod(
      database,
      fundingAccounts,
      currency,
      period,
    );
    if (assignedMinor > Math.max(assignableMinor, 0)) {
      throw new Error(
        `${currency} initial Assignments cannot exceed the selected Funding Account balance. Reduce Assignments or add an eligible Funding Account.`,
      );
    }
  }
}

function requireDraftShape(draft: SetupDraft): void {
  if (draft.version !== 1 || draft.id !== GUIDED_SETUP_DRAFT_ID) {
    throw new Error("This Setup Draft is unsupported. Discard it and start again.");
  }
  const currencies = draft.workspaces.map(({ currency }) => requireCurrency(currency));
  if (new Set(currencies).size !== currencies.length) {
    throw new Error("A Setup Draft repeats a currency workspace. Remove the duplicate workspace.");
  }
}

function requireEnvelopeFields(
  envelope: SetupDraftEnvelope,
  currency: string,
  envelopeIds: Set<string>,
): void {
  if (!envelope.id.trim() || envelopeIds.has(envelope.id)) {
    throw new Error("Setup Draft Envelope IDs must be distinct. Reload and try adding it again.");
  }
  envelopeIds.add(envelope.id);
  if (envelope.currency !== currency) {
    throw new Error(
      `Envelope ${envelope.id} uses ${envelope.currency}, not workspace currency ${currency}. Move it to the matching workspace before saving.`,
    );
  }
  if (!envelope.name.trim() || !envelope.icon.trim() || !envelope.color.trim()) {
    throw new Error(`Envelope ${envelope.id} needs a name, emoji, and color before it can save.`);
  }
  requireMinorUnits(envelope.initialAssignmentMinor, currency);
  if (envelope.initialAssignmentMinor < 0) {
    throw new Error("Initial Assignments cannot be negative. Enter zero or a positive amount.");
  }
}

async function getEligibleCategoryIds(
  database: SQLiteDatabase,
  categoryIds: readonly string[],
): Promise<Set<string>> {
  const uniqueIds = [...new Set(categoryIds)];
  if (uniqueIds.length === 0) return new Set();
  const placeholders = uniqueIds.map(() => "?").join(", ");
  const rows = await database.getAllAsync<{ id: string }>(
    `SELECT id FROM categories
     WHERE id IN (${placeholders}) AND lifecycle = 'active' AND type = 'expense'`,
    ...uniqueIds,
  );
  return new Set(rows.map(({ id }) => id));
}
