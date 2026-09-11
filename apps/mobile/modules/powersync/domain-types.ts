import { z } from "zod";

const sqliteBooleanSchema = z.union([z.literal(0), z.literal(1)]);
const scopeColumns = {
  ledger_id: z.string(),
  household_id: z.string().nullable(),
};
const auditColumns = {
  version: z.number().int().nonnegative(),
  created_by: z.string(),
  updated_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
};

export const powerSyncBudgetWorkspaceRowSchema = z.object({
  id: z.string(),
  ...scopeColumns,
  currency: z.string(),
  activation_period: z.string(),
  ...auditColumns,
});

export const powerSyncEnvelopeRowSchema = z.object({
  id: z.string(),
  ...scopeColumns,
  currency: z.string(),
  name: z.string(),
  icon: z.string(),
  color: z.string(),
  lifecycle: z.enum(["active", "archived"]),
  sort_order: z.number().int(),
  ...auditColumns,
});

export const powerSyncCategoryMappingRowSchema = z.object({
  id: z.string(),
  ...scopeColumns,
  category_id: z.string(),
  envelope_id: z.string().nullable(),
  effective_from_period: z.string(),
  ...auditColumns,
});

export const powerSyncFundingMembershipRowSchema = z.object({
  id: z.string(),
  ...scopeColumns,
  account_id: z.string(),
  currency: z.string(),
  active: sqliteBooleanSchema,
  effective_from_period: z.string(),
  ...auditColumns,
});

export const powerSyncRolloverSettingRowSchema = z.object({
  id: z.string(),
  ...scopeColumns,
  envelope_id: z.string(),
  positive_rollover: sqliteBooleanSchema,
  effective_from_period: z.string(),
  ...auditColumns,
});

export const powerSyncAssignmentRowSchema = z.object({
  id: z.string(),
  ...scopeColumns,
  currency: z.string(),
  budget_period: z.string(),
  source_envelope_id: z.string().nullable(),
  destination_envelope_id: z.string().nullable(),
  amount_minor: z.number().int().positive(),
  reverses_assignment_id: z.string().nullable(),
  ...auditColumns,
});

export const powerSyncRefundLinkRowSchema = z.object({
  id: z.string(),
  ...scopeColumns,
  original_transaction_id: z.string(),
  refund_transaction_id: z.string(),
  currency: z.string(),
  amount_minor: z.number().int().positive(),
  ...auditColumns,
});

export const powerSyncRecurringRuleRowSchema = z.object({
  id: z.string(),
  ...scopeColumns,
  name: z.string(),
  type: z.enum(["expense", "income", "transfer"]),
  amount_minor: z.number().int().nullable(),
  currency: z.string(),
  account_id: z.string().nullable(),
  to_account_id: z.string().nullable(),
  category_id: z.string().nullable(),
  description: z.string(),
  frequency: z.enum(["day", "week", "month", "year"]),
  interval_count: z.number().int().positive(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  end_count: z.number().int().positive().nullable(),
  time_zone: z.string(),
  lifecycle: z.enum(["active", "paused", "completed", "archived"]),
  health: z.enum(["ready", "needs_attention"]),
  attention_reasons: z.string(),
  attention_details: z.string().nullable(),
  eligibility_floor: z.string(),
  revision: z.number().int().positive(),
  lifecycle_changed_at: z.string().nullable(),
  health_changed_at: z.string().nullable(),
  last_settlement_attempt_at: z.string().nullable(),
  last_settlement_error: z.string().nullable(),
  created_by: z.string(),
  updated_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const powerSyncRecurringOccurrenceRowSchema = z.object({
  id: z.string(),
  ...scopeColumns,
  rule_id: z.string(),
  scheduled_date: z.string(),
  transaction_id: z.string().nullable(),
  settled_at: z.string(),
});

export type PowerSyncBudgetWorkspaceRow = z.infer<typeof powerSyncBudgetWorkspaceRowSchema>;
export type PowerSyncEnvelopeRow = z.infer<typeof powerSyncEnvelopeRowSchema>;
export type PowerSyncCategoryMappingRow = z.infer<typeof powerSyncCategoryMappingRowSchema>;
export type PowerSyncFundingMembershipRow = z.infer<typeof powerSyncFundingMembershipRowSchema>;
export type PowerSyncRolloverSettingRow = z.infer<typeof powerSyncRolloverSettingRowSchema>;
export type PowerSyncAssignmentRow = z.infer<typeof powerSyncAssignmentRowSchema>;
export type PowerSyncRefundLinkRow = z.infer<typeof powerSyncRefundLinkRowSchema>;
export type PowerSyncRecurringRuleRow = z.infer<typeof powerSyncRecurringRuleRowSchema>;
export type PowerSyncRecurringOccurrenceRow = z.infer<typeof powerSyncRecurringOccurrenceRowSchema>;
