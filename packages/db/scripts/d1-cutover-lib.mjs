import { createHash } from "node:crypto";

export const CUTOVER_TABLES = [
  { name: "user" },
  { name: "session" },
  { name: "account" },
  { name: "verification" },
  { name: "household" },
  { name: "membership" },
  { name: "invite_code" },
  { name: "accounts" },
  { name: "categories", sort: sortCategories },
  { name: "budget_workspaces", id: workspaceId },
  { name: "envelopes" },
  { name: "category_mappings", id: categoryMappingId },
  { name: "funding_memberships", id: fundingMembershipId },
  { name: "rollover_settings", id: rolloverSettingId },
  { name: "recurring_rules" },
  { name: "transactions" },
  { name: "refund_links" },
  { name: "assignments", sort: sortByCreatedAt },
  { name: "recurring_occurrences", id: recurringOccurrenceId },
  { name: "household_changes", sort: sortHouseholdChanges },
  { name: "command_results" },
  { name: "period_projection_cache" },
];

export const RESET_TABLES = [
  "_pipeline_assertions",
  "account",
  "accounts",
  "assignments",
  "budget_workspaces",
  "categories",
  "category_mappings",
  "command_results",
  "envelopes",
  "funding_memberships",
  "household",
  "household_change_sequences",
  "household_changes",
  "invite_code",
  "membership",
  "period_projection_cache",
  "recurring_occurrences",
  "recurring_rules",
  "refund_links",
  "rollover_settings",
  "session",
  "transactions",
  "user",
  "verification",
];

export function transformRow(row, targetColumns, idFactory) {
  const source = idFactory && row.id == null ? { ...row, id: idFactory(row) } : row;
  return Object.fromEntries(
    targetColumns
      .filter(({ name }) => Object.hasOwn(source, name))
      .map((column) => [column.name, convertValue(source[column.name], column.dataType)]),
  );
}

export function digestRows(rows) {
  const canonical = rows.map(normalizeRow).map(stableStringify).sort();
  return createHash("sha256").update(canonical.join("\n")).digest("hex");
}

export function normalizeRow(row) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, normalizeValue(value)]),
  );
}

export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && value.constructor === Object) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function convertValue(value, dataType) {
  if (value == null) return null;
  if (dataType === "boolean") return value === true || value === 1;
  if (dataType === "timestamp with time zone") {
    const date = value instanceof Date ? value : new Date(Number(value));
    if (Number.isNaN(date.getTime())) throw new Error(`Invalid timestamp value: ${String(value)}`);
    return date;
  }
  if (dataType === "jsonb") {
    if (Array.isArray(value) || value.constructor === Object) return value;
    return JSON.parse(String(value));
  }
  return value;
}

function normalizeValue(value) {
  if (value instanceof Date) return value.getTime();
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (value && value.constructor === Object) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeValue(item)]),
    );
  }
  return value;
}

function workspaceId(row) {
  return `migration:workspace:${row.household_id}:${row.currency}`;
}

function categoryMappingId(row) {
  return `migration:mapping:${row.category_id}:${row.effective_from_period}`;
}

function fundingMembershipId(row) {
  return `migration:funding:${row.account_id}:${row.effective_from_period}`;
}

function rolloverSettingId(row) {
  return `migration:rollover:${row.envelope_id}:${row.effective_from_period}`;
}

function recurringOccurrenceId(row) {
  return `migration:occurrence:${row.rule_id}:${row.scheduled_date}`;
}

function sortByCreatedAt(rows) {
  return [...rows].sort((left, right) => Number(left.created_at) - Number(right.created_at));
}

function sortHouseholdChanges(rows) {
  return [...rows].sort(
    (left, right) => left.household_id.localeCompare(right.household_id) || left.seq - right.seq,
  );
}

function sortCategories(rows) {
  const pending = new Map(rows.map((row) => [row.id, row]));
  const emitted = new Set();
  const result = [];
  while (pending.size > 0) {
    const ready = [...pending.values()].filter(
      (row) => row.parent_id == null || !pending.has(row.parent_id) || emitted.has(row.parent_id),
    );
    if (ready.length === 0) throw new Error("Category parent graph contains a cycle.");
    for (const row of ready) {
      pending.delete(row.id);
      emitted.add(row.id);
      result.push(row);
    }
  }
  return result;
}
