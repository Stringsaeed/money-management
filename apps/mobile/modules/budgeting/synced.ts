import type { QueryClient } from "@tanstack/react-query";
import type { CommandEnvelope, CommandResult } from "@trove/protocol";

import type { SQLiteDatabase } from "@/db/sqlite";
import { orpc } from "@/lib/server/orpc";
import type { SyncedLedgerBinding } from "@/modules/ledger-data-source/provider";
import type { SyncedTransactionLedger } from "@/modules/ledger-db/ledger";
import { commandMetadataFor } from "@/modules/powersync/command-metadata";
import { nowIso } from "@/utils/date";
import { generateId } from "@/utils/id";

import { createBudgetingCoordinator } from "./budgeting";
import type {
  AssignmentHistoryEntry,
  BudgetProjection,
  BudgetingCoordinator,
  CorrectMoveMoneyRequest,
  CreateEnvelopeRequest,
  EnvelopeCategoryOption,
  MoveMoneyEndpoint,
  MoveMoneyPreview,
  MoveMoneyRequest,
  UpdateEnvelopeRequest,
  WorkspaceSelection,
} from "./types";
import { periodForLocalDate, requireCurrency } from "./validation";

interface SyncedBudgetingOptions {
  readonly database: SQLiteDatabase;
  readonly binding: SyncedLedgerBinding;
  readonly userId: string;
  readonly ledger: SyncedTransactionLedger;
  readonly queryClient?: QueryClient;
}

export const createSyncedBudgetingCoordinator = (
  options: SyncedBudgetingOptions,
): BudgetingCoordinator => {
  const local = createBudgetingCoordinator(options.database, { queryClient: options.queryClient });
  return {
    ...local,
    activateWorkspace: async (request) => {
      const period = periodForLocalDate(request.localDate);
      await apply(options, "budget.configure", {
        action: "workspace.activate",
        currency: request.currency,
        activationPeriod: period,
        fundingAccountIds: request.fundingAccountIds,
      });
      return requireProjection(options, request.currency, period);
    },
    updateFundingMembership: async (request) => {
      const account = options.ledger.collections.accounts.get(request.accountId);
      if (!account) throw new Error("Funding Account is not in the authorized PowerSync ledger.");
      const period = periodForLocalDate(request.localDate);
      await apply(options, "budget.configure", {
        action: "funding_membership.set",
        accountId: request.accountId,
        currency: account.currency,
        active: request.included,
        effectiveFromPeriod: period,
      });
      return requireProjection(options, account.currency, period);
    },
    getFundingAccountSuggestions: async ({ currency }) =>
      options.ledger.collections.accounts.toArray
        .filter(
          (row) =>
            row.ledger_id === options.binding.ledgerId &&
            row.currency === currency &&
            row.lifecycle === "active",
        )
        .map((row) => ({
          id: row.id,
          currency: row.currency,
          type:
            row.type === "card"
              ? ("credit_card" as const)
              : row.type === "cash"
                ? ("cash" as const)
                : ("checking" as const),
          excludedFromHomeTotal: row.exclude_from_total === 1,
          suggested: row.type !== "card" && row.exclude_from_total === 0,
        })),
    getWorkspaceSelection: () => workspaceSelection(options),
    setHomeCurrency: ({ currency }) => setWorkspaceSetting(options, "budgetHomeCurrency", currency),
    selectWorkspace: ({ currency }) =>
      setWorkspaceSetting(options, "budgetSelectedCurrency", currency),
    getProjection: ({ currency, period }) => projection(options, currency, period),
    previewMoveMoney: (request) => previewMove(options, request),
    previewCorrectMoveMoney: (request) => previewMove(options, request),
    moveMoney: async (request) => {
      await insertAssignment(options, request);
      return requireProjection(options, request.currency, request.period);
    },
    correctMoveMoney: async (request) => {
      await correctAssignment(options, request);
      return requireProjection(options, request.currency, request.period);
    },
    getAssignmentHistory: async ({ currency, period }) =>
      assignmentHistory(options, currency, period),
    createEnvelope: async (request) => {
      await createEnvelope(options, request);
      return requireProjection(options, request.currency, periodForLocalDate(request.localDate));
    },
    updateEnvelope: async (request) => {
      const row = options.ledger.collections.envelopes.get(request.envelopeId);
      if (!row) throw new Error("Envelope is not in the authorized PowerSync collection.");
      await updateEnvelope(options, request, row.version, row.currency);
      return requireProjection(options, row.currency, periodForLocalDate(request.localDate));
    },
    getEnvelopeFormOptions: ({ currency, period }) => formOptions(options, currency, period),
    getAccountDependencies: async () => [],
  };
};

async function workspaceSelection(options: SyncedBudgetingOptions): Promise<WorkspaceSelection> {
  const workspaces = options.ledger.collections.budgetWorkspaces.toArray
    .filter((row) => row.ledger_id === options.binding.ledgerId)
    .map((row) => ({ currency: row.currency, activationPeriod: row.activation_period }))
    .sort((left, right) => left.currency.localeCompare(right.currency));
  const settings = await options.database.getAllAsync<{ key: string; value: string }>(
    "SELECT key, value FROM app_settings WHERE key IN (?, ?)",
    "budgetHomeCurrency",
    "budgetSelectedCurrency",
  );
  const values = new Map(settings.map(({ key, value }) => [key, value]));
  const currencies = new Set(workspaces.map(({ currency }) => currency));
  const explicitHome = values.get("budgetHomeCurrency");
  const hasExplicitHomeCurrency = explicitHome !== undefined && currencies.has(explicitHome);
  const homeCurrency = hasExplicitHomeCurrency ? explicitHome : (workspaces[0]?.currency ?? null);
  const selected = values.get("budgetSelectedCurrency");
  const selectedCurrency = selected && currencies.has(selected) ? selected : homeCurrency;
  return { workspaces, homeCurrency, hasExplicitHomeCurrency, selectedCurrency };
}

async function setWorkspaceSetting(
  options: SyncedBudgetingOptions,
  key: string,
  requestedCurrency: string,
): Promise<void> {
  const currency = requireCurrency(requestedCurrency);
  const exists = options.ledger.collections.budgetWorkspaces.toArray.some(
    (row) => row.ledger_id === options.binding.ledgerId && row.currency === currency,
  );
  if (!exists) throw new Error(`The ${currency} budget workspace does not exist.`);
  await options.database.runAsync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    currency,
  );
}

async function projection(
  options: SyncedBudgetingOptions,
  currency: string,
  period: string,
): Promise<BudgetProjection | null> {
  const workspace = options.ledger.collections.budgetWorkspaces.toArray.find(
    (row) => row.ledger_id === options.binding.ledgerId && row.currency === currency,
  );
  if (!workspace || period < workspace.activation_period) return null;
  const result = await orpc.projections.get({
    scope: options.binding.scope,
    householdId: options.binding.householdId ?? undefined,
    currency,
    startPeriod: period,
    endPeriod: period,
  });
  const found = result.projections[0];
  if (!found) return null;
  return {
    currency,
    period,
    fundingPool: { currency, amountMinor: found.fundingPoolMinor },
    unassignedMoney: { currency, amountMinor: found.unassignedMinor },
    budgetHealth:
      found.unassignedMinor < 0
        ? {
            status: "needs_attention",
            reasons: [
              {
                kind: "budget-shortfall",
                currency,
                amountMinor: -found.unassignedMinor,
                recoveryAction:
                  "Increase the same-currency Funding Pool or move Money back to Unassigned until the shortfall is zero.",
              },
            ],
          }
        : { status: "ready", reasons: [] },
    envelopes: found.envelopes
      .filter((row) => row.lifecycle === "active")
      .map((row) => mapEnvelope(options, row, currency, period)),
    archivedEnvelopes: found.envelopes
      .filter((row) => row.lifecycle === "archived")
      .map((row) => mapEnvelope(options, row, currency, period)),
  };
}

function mapEnvelope(
  options: SyncedBudgetingOptions,
  row: Awaited<ReturnType<typeof orpc.projections.get>>["projections"][number]["envelopes"][number],
  currency: string,
  period: string,
) {
  const mappingMissing = row.health.reasons.some(
    (reason) => reason.kind === "missing-active-expense-category",
  );
  return {
    id: row.envelopeId,
    currency,
    name: row.name,
    icon: row.icon,
    color: row.color,
    lifecycle: row.lifecycle,
    sortOrder: row.sortOrder,
    categoryIds: mappedCategoryIds(options, row.envelopeId, period),
    positiveRollover: positiveRollover(options, row.envelopeId, period),
    health: mappingMissing
      ? {
          status: "needs_attention" as const,
          reasons: [
            {
              kind: "missing-active-expense-category" as const,
              recoveryAction: "Map at least one active expense Category to this Envelope." as const,
            },
          ],
        }
      : ({ status: "ready", reasons: [] } as const),
    availableMoney: { currency, amountMinor: row.availableMinor },
    assignedMoney: { currency, amountMinor: row.assignedMinor },
    netSpent: { currency, amountMinor: row.netSpentMinor },
  };
}

async function requireProjection(
  options: SyncedBudgetingOptions,
  currency: string,
  period: string,
): Promise<BudgetProjection> {
  const value = await projection(options, currency, period);
  if (!value) throw new Error(`The ${currency} budget is unavailable for ${period}.`);
  await options.queryClient?.invalidateQueries({ queryKey: ["budget"] });
  return value;
}

async function createEnvelope(
  options: SyncedBudgetingOptions,
  request: CreateEnvelopeRequest,
): Promise<void> {
  const issuedAt = request.now || nowIso();
  const command = envelopeCommand(options, request, 0, request.currency, "envelope.create");
  await options.ledger.collections.envelopes.insert(
    {
      id: request.id,
      ledger_id: options.binding.ledgerId,
      household_id: options.binding.householdId,
      currency: request.currency,
      name: request.name.trim(),
      icon: request.icon,
      color: request.color,
      lifecycle: "active",
      sort_order: request.sortOrder ?? 0,
      version: 0,
      created_by: options.userId,
      updated_by: options.userId,
      created_at: issuedAt,
      updated_at: issuedAt,
    },
    { metadata: commandMetadataFor(command) },
  ).isPersisted.promise;
}

async function updateEnvelope(
  options: SyncedBudgetingOptions,
  request: UpdateEnvelopeRequest,
  version: number,
  currency: string,
): Promise<void> {
  const command = envelopeCommand(options, request, version, currency, "envelope.update");
  await options.ledger.collections.envelopes.update(
    request.envelopeId,
    { metadata: commandMetadataFor(command) },
    (row) => {
      row.name = request.name.trim();
      row.icon = request.icon;
      row.color = request.color;
      row.sort_order = request.sortOrder ?? row.sort_order;
      row.version = version + 1;
      row.updated_by = options.userId;
      row.updated_at = request.now;
    },
  ).isPersisted.promise;
}

function envelopeCommand(
  options: SyncedBudgetingOptions,
  request: CreateEnvelopeRequest | UpdateEnvelopeRequest,
  version: number,
  currency: string,
  action: "envelope.create" | "envelope.update",
): CommandEnvelope {
  return {
    commandId: generateId(),
    scope: options.binding.scope,
    householdId: options.binding.householdId ?? undefined,
    kind: "budget.configure",
    issuedAt: request.now,
    payload: {
      action,
      envelopeId: "id" in request ? request.id : request.envelopeId,
      ...(action === "envelope.create" ? { currency } : { expectedVersion: version }),
      effectiveFromPeriod: periodForLocalDate(request.localDate),
      name: request.name,
      icon: request.icon,
      color: request.color,
      categoryIds: [...request.categoryIds],
      ...(action === "envelope.update" && {
        changedCategoryIds: [...(request as UpdateEnvelopeRequest).changedCategoryIds],
      }),
      positiveRollover: request.positiveRollover,
      sortOrder: request.sortOrder ?? 0,
    },
  };
}

async function insertAssignment(
  options: SyncedBudgetingOptions,
  request: MoveMoneyRequest,
): Promise<void> {
  const command: CommandEnvelope = {
    commandId: generateId(),
    scope: options.binding.scope,
    householdId: options.binding.householdId ?? undefined,
    kind: "assignment.commit",
    issuedAt: request.now,
    payload: {
      assignmentId: request.id,
      destinationEnvelopeId: request.destinationEnvelopeId,
      sourceEnvelopeId: request.sourceEnvelopeId,
      currency: request.currency,
      amountMinor: request.amountMinor,
      budgetPeriod: request.period,
      reversesAssignmentId: null,
    },
  };
  await options.ledger.collections.assignments.insert(assignmentRow(options, request, null), {
    metadata: commandMetadataFor(command),
  }).isPersisted.promise;
}

async function correctAssignment(
  options: SyncedBudgetingOptions,
  request: CorrectMoveMoneyRequest,
): Promise<void> {
  const original = options.ledger.collections.assignments.get(request.originalAssignmentId);
  if (!original) throw new Error("The original Assignment is not in PowerSync.");
  if (!original.destination_envelope_id) {
    throw new Error("Only assignments into an Envelope can be corrected.");
  }
  await apply(options, "assignment.correct", {
    originalAssignmentId: original.id,
    reversalId: request.reversalId,
    replacementId: request.id,
    currency: request.currency,
    budgetPeriod: request.period,
    sourceEnvelopeId: request.sourceEnvelopeId,
    destinationEnvelopeId: request.destinationEnvelopeId,
    amountMinor: request.amountMinor,
  });
}

function assignmentRow(
  options: SyncedBudgetingOptions,
  request: MoveMoneyRequest,
  reversesAssignmentId: string | null,
) {
  return {
    id: request.id,
    ledger_id: options.binding.ledgerId,
    household_id: options.binding.householdId,
    currency: request.currency,
    budget_period: request.period,
    source_envelope_id: request.sourceEnvelopeId,
    destination_envelope_id: request.destinationEnvelopeId,
    amount_minor: request.amountMinor,
    reverses_assignment_id: reversesAssignmentId,
    version: 0,
    created_by: options.userId,
    updated_by: options.userId,
    created_at: request.now,
    updated_at: request.now,
  };
}

async function previewMove(
  options: SyncedBudgetingOptions,
  request: MoveMoneyRequest,
): Promise<MoveMoneyPreview> {
  const current = await requireProjection(options, request.currency, request.period);
  const balance = (id: MoveMoneyEndpoint) =>
    id === null
      ? current.unassignedMoney.amountMinor
      : (current.envelopes.find((row) => row.id === id)?.availableMoney.amountMinor ?? 0);
  const sourceBefore = balance(request.sourceEnvelopeId);
  const destinationBefore = balance(request.destinationEnvelopeId);
  return {
    currency: request.currency,
    period: request.period,
    amountMinor: request.amountMinor,
    source: {
      envelopeId: request.sourceEnvelopeId,
      before: { currency: request.currency, amountMinor: sourceBefore },
      after: { currency: request.currency, amountMinor: sourceBefore - request.amountMinor },
    },
    destination: {
      envelopeId: request.destinationEnvelopeId,
      before: { currency: request.currency, amountMinor: destinationBefore },
      after: { currency: request.currency, amountMinor: destinationBefore + request.amountMinor },
    },
    deficitRouting: {
      cashOverspendingMinor: 0,
      unfundedCardSpendingMinor: 0,
      newAvailabilityMinor: destinationBefore + request.amountMinor,
    },
  };
}

function assignmentHistory(
  options: SyncedBudgetingOptions,
  currency: string,
  period: string,
): AssignmentHistoryEntry[] {
  const rows = options.ledger.collections.assignments.toArray.filter(
    (row) =>
      row.ledger_id === options.binding.ledgerId &&
      row.currency === currency &&
      row.budget_period === period,
  );
  const byId = new Map(rows.map((row) => [row.id, row]));
  return rows
    .map((row) => ({
      id: row.id,
      currency: row.currency,
      budgetPeriod: row.budget_period,
      sourceEnvelopeId: row.source_envelope_id,
      destinationEnvelopeId: row.destination_envelope_id,
      amountMinor: row.amount_minor,
      reversesAssignmentId: row.reverses_assignment_id,
      kind: row.reverses_assignment_id
        ? byId.get(row.reverses_assignment_id)?.reverses_assignment_id
          ? ("replacement" as const)
          : ("reversal" as const)
        : ("original" as const),
      createdAt: row.created_at,
    }))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function mappedCategoryIds(
  options: SyncedBudgetingOptions,
  envelopeId: string,
  period: string,
): string[] {
  const latest = new Map<string, { envelopeId: string | null; period: string }>();
  for (const mapping of options.ledger.collections.categoryMappings.toArray) {
    if (mapping.ledger_id !== options.binding.ledgerId || mapping.effective_from_period > period) {
      continue;
    }
    const current = latest.get(mapping.category_id);
    if (!current || current.period < mapping.effective_from_period) {
      latest.set(mapping.category_id, {
        envelopeId: mapping.envelope_id,
        period: mapping.effective_from_period,
      });
    }
  }
  return [...latest]
    .filter(([, mapping]) => mapping.envelopeId === envelopeId)
    .map(([categoryId]) => categoryId)
    .sort();
}

function positiveRollover(
  options: SyncedBudgetingOptions,
  envelopeId: string,
  period: string,
): boolean {
  return (
    options.ledger.collections.rolloverSettings.toArray
      .filter(
        (row) =>
          row.ledger_id === options.binding.ledgerId &&
          row.envelope_id === envelopeId &&
          row.effective_from_period <= period,
      )
      .sort((left, right) =>
        right.effective_from_period.localeCompare(left.effective_from_period),
      )[0]?.positive_rollover !== 0
  );
}

async function formOptions(
  options: SyncedBudgetingOptions,
  currency: string,
  period: string,
): Promise<EnvelopeCategoryOption[]> {
  const mappings = options.ledger.collections.categoryMappings.toArray.filter(
    (row) => row.ledger_id === options.binding.ledgerId,
  );
  return options.ledger.collections.categories.toArray
    .filter(
      (row) =>
        row.ledger_id === options.binding.ledgerId &&
        row.lifecycle === "active" &&
        row.type === "expense",
    )
    .map((category) => {
      const timeline = mappings
        .filter((mapping) => mapping.category_id === category.id)
        .sort((left, right) =>
          left.effective_from_period.localeCompare(right.effective_from_period),
        );
      const current = timeline.filter((mapping) => mapping.effective_from_period <= period).at(-1);
      const future = timeline.find((mapping) => mapping.effective_from_period > period);
      const incompatible = options.ledger.collections.transactions.toArray.some(
        (transaction) =>
          transaction.ledger_id === options.binding.ledgerId &&
          transaction.category_id === category.id &&
          transaction.currency !== currency,
      );
      return {
        id: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        mappedEnvelopeId: current?.envelope_id ?? null,
        mappedThroughPeriod: future?.effective_from_period ?? null,
        futureMappedEnvelopeId: future?.envelope_id ?? null,
        futureMappingPeriod: future?.effective_from_period ?? null,
        requiresConfirmation: false,
        eligible: !incompatible,
        ineligibilityReason: incompatible ? ("incompatible-currency" as const) : null,
      };
    });
}

async function apply(
  options: SyncedBudgetingOptions,
  kind: CommandEnvelope["kind"],
  payload: unknown,
): Promise<Extract<CommandResult, { kind: "applied" }>> {
  const result = await orpc.commands.apply({
    commandId: generateId(),
    scope: options.binding.scope,
    householdId: options.binding.householdId ?? undefined,
    kind,
    issuedAt: nowIso(),
    payload,
  });
  if (result.kind !== "applied") {
    throw new Error(`Budget command was rejected: ${result.kind}`);
  }
  return result;
}
