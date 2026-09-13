/**
 * Catalog checks for the schema that the Worker expects after migrations
 * 0011 through 0015. This module only describes and evaluates checks. The
 * database reader lives in verify-post-cutover-schema.mjs and issues SELECTs
 * against the PostgreSQL catalogs.
 */

export const LEDGER_SCOPED_0011_TABLES = Object.freeze([
  "accounts",
  "categories",
  "transactions",
  "household_changes",
  "command_results",
  "household_change_sequences",
]);

export const LEDGER_SCOPED_0012_TABLES = Object.freeze([
  "budget_workspaces",
  "envelopes",
  "category_mappings",
  "funding_memberships",
  "rollover_settings",
  "assignments",
  "refund_links",
  "period_projection_cache",
  "recurring_rules",
  "recurring_occurrences",
]);

export const LEDGER_SCOPED_TABLES = Object.freeze([
  ...LEDGER_SCOPED_0011_TABLES,
  ...LEDGER_SCOPED_0012_TABLES,
]);

export const POWERSYNC_PUBLICATION_TABLES = Object.freeze([
  "membership",
  "ledger",
  "accounts",
  "categories",
  "transactions",
  "budget_workspaces",
  "envelopes",
  "category_mappings",
  "funding_memberships",
  "rollover_settings",
  "assignments",
  "refund_links",
  "recurring_rules",
  "recurring_occurrences",
]);

export const MIGRATION_TRACKING_TABLE = "trove_schema_migrations";
export const POSTGRES_IDENTIFIER_MAX_BYTES = 63;

/**
 * PostgreSQL stores identifiers in NAMEDATALEN - 1 bytes. All checked-in
 * migration identifiers are ASCII, so a character slice is byte-accurate and
 * mirrors the catalog names exposed by pg_constraint and pg_indexes.
 *
 * @param {string} identifier
 * @returns {string}
 */
export function normalizePostgresIdentifier(identifier) {
  return String(identifier).slice(0, POSTGRES_IDENTIFIER_MAX_BYTES);
}

// PostgreSQL catalog names observed on the production branch for the seven
// overlong 0012 foreign-key declarations. Keep this allowlist explicit so a
// similarly named but different constraint cannot satisfy a deploy check.
export const POSTGRES_IDENTIFIER_ALIASES = Object.freeze({
  category_mappings_ledger_id_envelope_id_envelopes_ledger_id_id_fk:
    "category_mappings_ledger_id_envelope_id_envelopes_ledger_id_id_",
  category_mappings_ledger_id_category_id_categories_ledger_id_id_fk:
    "category_mappings_ledger_id_category_id_categories_ledger_id_id",
  funding_memberships_ledger_id_account_id_accounts_ledger_id_id_fk:
    "funding_memberships_ledger_id_account_id_accounts_ledger_id_id_",
  rollover_settings_ledger_id_envelope_id_envelopes_ledger_id_id_fk:
    "rollover_settings_ledger_id_envelope_id_envelopes_ledger_id_id_",
  assignments_ledger_id_source_envelope_id_envelopes_ledger_id_id_fk:
    "assignments_ledger_id_source_envelope_id_envelopes_ledger_id_id",
  assignments_ledger_id_destination_envelope_id_envelopes_ledger_id_id_fk:
    "assignments_ledger_id_destination_envelope_id_envelopes_ledger_",
  recurring_occurrences_ledger_id_rule_id_recurring_rules_ledger_id_id_fk:
    "recurring_occurrences_ledger_id_rule_id_recurring_rules_ledger_",
});

/**
 * Resolve an expected migration identifier to the exact catalog spelling.
 *
 * @param {string} identifier
 * @returns {string}
 */
export function catalogIdentifier(identifier) {
  return POSTGRES_IDENTIFIER_ALIASES[identifier] ?? normalizePostgresIdentifier(identifier);
}

const table = (tableName) => ({
  key: `table:${tableName}`,
  type: "table",
  table: tableName,
});

const column = (tableName, columnName, isNullable) => ({
  key: `column:${tableName}.${columnName}${isNullable === "NO" ? " NOT NULL" : " NULLABLE"}`,
  type: "column",
  table: tableName,
  column: columnName,
  isNullable,
});

const constraint = (tableName, constraintName, definitionIncludes) => ({
  key: `constraint:${tableName}.${catalogIdentifier(constraintName)}`,
  type: "constraint",
  table: tableName,
  name: constraintName,
  definitionIncludes,
});

const index = (tableName, indexName, definitionIncludes) => ({
  key: `index:${tableName}.${catalogIdentifier(indexName)}`,
  type: "index",
  table: tableName,
  name: indexName,
  definitionIncludes,
});

const publicationTable = (tableName) => ({
  key: `publication:powersync.public.${tableName}`,
  type: "publication-table",
  publication: "powersync",
  schema: "public",
  table: tableName,
});

const absentTable = (tableName) => ({
  key: `absent-table:${tableName}`,
  type: "absent-table",
  table: tableName,
});

const absentColumn = (tableName, columnName) => ({
  key: `absent-column:${tableName}.${columnName}`,
  type: "absent-column",
  table: tableName,
  column: columnName,
});

const absentConstraint = (tableName, constraintName) => ({
  key: `absent-constraint:${tableName}.${constraintName}`,
  type: "absent-constraint",
  table: tableName,
  name: constraintName,
});

const absentIndex = (tableName, indexName) => ({
  key: `absent-index:${tableName}.${indexName}`,
  type: "absent-index",
  table: tableName,
  name: indexName,
});

const absentRoutine = (routineName) => ({
  key: `absent-function:${routineName}`,
  type: "absent-routine",
  name: routineName,
});

const absentTrigger = (tableName, triggerName) => ({
  key: `absent-trigger:${tableName}.${triggerName}`,
  type: "absent-trigger",
  table: tableName,
  name: triggerName,
});

const ledgerTableChecks = [
  table("ledger"),
  column("ledger", "id", "NO"),
  column("ledger", "kind", "NO"),
  column("ledger", "personal_user_id", "YES"),
  column("ledger", "organization_id", "YES"),
  constraint("ledger", "ledger_personal_user_id_unique"),
  constraint("ledger", "ledger_personal_user_id_user_id_fk"),
  constraint("ledger", "ledger_kind_valid"),
  constraint("ledger", "ledger_owner_matches_kind"),
  index("ledger", "ledger_organization_idx"),
];

const ledgerScopeColumnChecks = LEDGER_SCOPED_TABLES.flatMap((tableName) => [
  column(tableName, "ledger_id", "NO"),
]);

const ledgerScope0011ConstraintChecks = [
  ...LEDGER_SCOPED_0011_TABLES.map((tableName) =>
    constraint(tableName, `${tableName}_ledger_id_ledger_id_fk`),
  ),
  constraint("accounts", "accounts_ledger_id_id_unique"),
  constraint("categories", "categories_ledger_id_id_unique"),
  constraint("transactions", "transactions_ledger_id_account_id_accounts_ledger_id_id_fk"),
  constraint("transactions", "transactions_ledger_id_to_account_id_accounts_ledger_id_id_fk"),
  constraint("transactions", "transactions_ledger_id_category_id_categories_ledger_id_id_fk"),
  constraint("command_results", "command_results_ledger_id_command_id_pk"),
  constraint("household_change_sequences", "household_change_sequences_ledger_id_pk"),
  constraint("accounts", "accounts_household_required_for_organization"),
  constraint("categories", "categories_household_required_for_organization"),
  constraint("transactions", "transactions_household_required_for_organization"),
];

const ledgerScope0011IndexChecks = [
  index("accounts", "accounts_ledger_lifecycle_idx"),
  index("categories", "categories_ledger_lifecycle_idx"),
  index("transactions", "transactions_ledger_date_idx"),
  index("transactions", "transactions_ledger_account_idx"),
  index("household_changes", "household_changes_ledger_seq_unique"),
  index("household_changes", "household_changes_ledger_command_unique"),
];

const budgetHouseholdNullableChecks = LEDGER_SCOPED_0012_TABLES.map((tableName) =>
  column(tableName, "household_id", "YES"),
);

const ledgerScope0011HouseholdNullableChecks = LEDGER_SCOPED_0011_TABLES.map((tableName) =>
  column(tableName, "household_id", "YES"),
);

const ledgerScope0012ConstraintChecks = [
  ...LEDGER_SCOPED_0012_TABLES.map((tableName) =>
    constraint(tableName, `${tableName}_ledger_id_ledger_id_fk`),
  ),
  constraint("envelopes", "envelopes_ledger_id_id_unique"),
  constraint("assignments", "assignments_ledger_id_id_unique"),
  constraint("refund_links", "refund_links_ledger_id_id_unique"),
  constraint("recurring_rules", "recurring_rules_ledger_id_id_unique"),
  constraint(
    "category_mappings",
    "category_mappings_ledger_id_envelope_id_envelopes_ledger_id_id_fk",
    ["foreign key (ledger_id, envelope_id)", "references envelopes(ledger_id, id)"],
  ),
  constraint(
    "category_mappings",
    "category_mappings_ledger_id_category_id_categories_ledger_id_id_fk",
    ["foreign key (ledger_id, category_id)", "references categories(ledger_id, id)"],
  ),
  constraint(
    "funding_memberships",
    "funding_memberships_ledger_id_account_id_accounts_ledger_id_id_fk",
    ["foreign key (ledger_id, account_id)", "references accounts(ledger_id, id)"],
  ),
  constraint(
    "rollover_settings",
    "rollover_settings_ledger_id_envelope_id_envelopes_ledger_id_id_fk",
    ["foreign key (ledger_id, envelope_id)", "references envelopes(ledger_id, id)"],
  ),
  constraint("assignments", "assignments_ledger_id_source_envelope_id_envelopes_ledger_id_id_fk", [
    "foreign key (ledger_id, source_envelope_id)",
    "references envelopes(ledger_id, id)",
  ]),
  constraint(
    "assignments",
    "assignments_ledger_id_destination_envelope_id_envelopes_ledger_id_id_fk",
    ["foreign key (ledger_id, destination_envelope_id)", "references envelopes(ledger_id, id)"],
  ),
  constraint(
    "recurring_occurrences",
    "recurring_occurrences_ledger_id_rule_id_recurring_rules_ledger_id_id_fk",
    ["foreign key (ledger_id, rule_id)", "references recurring_rules(ledger_id, id)"],
  ),
  constraint(
    "period_projection_cache",
    "period_projection_cache_ledger_id_currency_budget_period_pk",
    ["primary key (ledger_id, currency, budget_period)"],
  ),
  ...LEDGER_SCOPED_0012_TABLES.map((tableName) =>
    constraint(tableName, `${tableName}_household_required_for_organization`),
  ),
  index("budget_workspaces", "budget_workspaces_ledger_currency_unique", ["create unique index"]),
  index("category_mappings", "category_mappings_ledger_category_period_unique", [
    "create unique index",
  ]),
  index("funding_memberships", "funding_memberships_ledger_account_period_unique", [
    "create unique index",
  ]),
  index("rollover_settings", "rollover_settings_ledger_envelope_period_unique", [
    "create unique index",
  ]),
  index("recurring_occurrences", "recurring_occurrences_ledger_rule_date_unique", [
    "create unique index",
  ]),
];

const ledgerScope0012IndexChecks = [
  index("envelopes", "envelopes_ledger_currency_idx"),
  index("assignments", "assignments_ledger_period_idx"),
  index("category_mappings", "category_mappings_ledger_category_idx"),
  index("funding_memberships", "funding_memberships_ledger_currency_idx"),
  index("rollover_settings", "rollover_settings_ledger_envelope_idx"),
  index("recurring_rules", "recurring_rules_ledger_lifecycle_idx"),
  index("recurring_occurrences", "recurring_occurrences_ledger_rule_idx"),
];

const workosHouseholdChecks = [
  column("membership", "status", "NO"),
  column("membership", "observed_at", "NO"),
  column("membership", "observed_event_id", "YES"),
  constraint("membership", "membership_status_valid"),
  index("membership", "membership_household_status_idx"),
  column("household", "create_request_id", "YES"),
  column("household", "members_reconciled_at", "YES"),
  constraint("household", "household_create_request_id_unique"),
  table("widget_handoff"),
  column("widget_handoff", "code_hash", "NO"),
  column("widget_handoff", "user_id", "NO"),
  column("widget_handoff", "organization_id", "NO"),
  index("widget_handoff", "widget_handoff_expires_idx"),
];

const deletionChecks = [
  table("deletion_operation"),
  column("deletion_operation", "id", "NO"),
  column("deletion_operation", "kind", "NO"),
  column("deletion_operation", "target_id", "NO"),
  column("deletion_operation", "requested_by_user_id", "NO"),
  column("deletion_operation", "status", "NO"),
  constraint("deletion_operation", "deletion_operation_kind_valid"),
  constraint("deletion_operation", "deletion_operation_status_valid"),
  index("deletion_operation", "deletion_operation_target_idx"),
  index("deletion_operation", "deletion_operation_status_idx"),
  table("deleted_identity"),
  column("deleted_identity", "id", "NO"),
  column("deleted_identity", "kind", "NO"),
  constraint("deleted_identity", "deleted_identity_kind_valid"),
];

const legacyAuthCleanupChecks = [
  absentTable("session"),
  absentTable("account"),
  absentTable("verification"),
  absentTable("invite_code"),
  absentColumn("accounts", "visibility"),
  absentConstraint("accounts", "accounts_private_owner_required"),
  absentIndex("accounts", "accounts_household_visibility_owner_idx"),
  absentRoutine("mirror_household_organization_ledger"),
  absentTrigger("household", "household_mirror_ledger_insert"),
  absentTrigger("household", "household_mirror_ledger_delete"),
];

/**
 * Every check below is catalog metadata only. Keep the 0012 declarations
 * explicit so a partially applied migration cannot pass on a representative
 * column check while missing an FK, index, primary key, or household guard.
 */
export const SCHEMA_CHECKS = Object.freeze([
  ...ledgerTableChecks,
  ...ledgerScopeColumnChecks,
  ...ledgerScope0011ConstraintChecks,
  ...ledgerScope0011IndexChecks,
  ...ledgerScope0011HouseholdNullableChecks,
  ...budgetHouseholdNullableChecks,
  ...ledgerScope0012ConstraintChecks,
  ...ledgerScope0012IndexChecks,
  ...workosHouseholdChecks,
  ...deletionChecks,
  ...legacyAuthCleanupChecks,
  ...POWERSYNC_PUBLICATION_TABLES.map(publicationTable),
]);

// Keep this alias for callers that use the language from the earlier
// best-effort ensure script. The verifier's checks include absence and shape,
// not merely object presence.
export const PRESENCE_CHECKS = SCHEMA_CHECKS;

/**
 * Read only the PostgreSQL catalog rows needed by SCHEMA_CHECKS. Every query
 * is a static SELECT; keeping the query set here makes it straightforward to
 * audit that the deploy gate cannot mutate the database.
 *
 * @param {import("postgres").Sql} sql
 * @returns {Promise<{
 *   tables: Array<Record<string, unknown>>,
 *   columns: Array<Record<string, unknown>>,
 *   constraints: Array<Record<string, unknown>>,
 *   indexes: Array<Record<string, unknown>>,
 *   publicationTables: Array<Record<string, unknown>>,
 *   routines: Array<Record<string, unknown>>,
 *   triggers: Array<Record<string, unknown>>,
 *   migrationMarkers: Array<Record<string, unknown>>,
 * }>}
 */
export async function readSchemaSnapshot(sql) {
  const [
    tables,
    columns,
    constraints,
    indexes,
    publicationTables,
    routines,
    triggers,
    markerTable,
  ] = await Promise.all([
    sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
      `,
    sql`
        SELECT table_name, column_name, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
      `,
    sql`
        SELECT
          pg_class.relname AS table_name,
          pg_constraint.conname AS constraint_name,
          pg_get_constraintdef(pg_constraint.oid, true) AS definition
        FROM pg_constraint
        JOIN pg_class
          ON pg_class.oid = pg_constraint.conrelid
        JOIN pg_namespace
          ON pg_namespace.oid = pg_class.relnamespace
        WHERE pg_namespace.nspname = 'public'
      `,
    sql`
        SELECT schemaname, tablename, indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
      `,
    sql`
        SELECT pubname, schemaname, tablename
        FROM pg_publication_tables
        WHERE pubname = 'powersync'
          AND schemaname = 'public'
      `,
    sql`
        SELECT pg_proc.proname AS routine_name
        FROM pg_proc
        JOIN pg_namespace
          ON pg_namespace.oid = pg_proc.pronamespace
        WHERE pg_namespace.nspname = 'public'
      `,
    sql`
        SELECT pg_trigger.tgname AS trigger_name, pg_class.relname AS table_name
        FROM pg_trigger
        JOIN pg_class
          ON pg_class.oid = pg_trigger.tgrelid
        JOIN pg_namespace
          ON pg_namespace.oid = pg_class.relnamespace
        WHERE pg_namespace.nspname = 'public'
          AND NOT pg_trigger.tgisinternal
      `,
    sql`
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ${MIGRATION_TRACKING_TABLE}
          AND table_type = 'BASE TABLE'
        LIMIT 1
      `,
  ]);

  // The marker table is created by the protected migration runner only when
  // a migration at or above its future-version boundary is applied. Avoid a
  // relation-not-found query on older production schemas.
  const migrationMarkers =
    markerTable.length === 0
      ? []
      : await sql`
          SELECT version, tag, sha256
          FROM "public"."trove_schema_migrations"
          ORDER BY version
        `;

  return {
    tables,
    columns,
    constraints,
    indexes,
    publicationTables,
    routines,
    triggers,
    migrationMarkers,
  };
}

/**
 * @typedef {{
 *   tables?: Array<Record<string, unknown>>,
 *   columns?: Array<Record<string, unknown>>,
 *   constraints?: Array<Record<string, unknown>>,
 *   indexes?: Array<Record<string, unknown>>,
 *   publicationTables?: Array<Record<string, unknown>>,
 *   routines?: Array<Record<string, unknown>>,
 *   triggers?: Array<Record<string, unknown>>,
 *   migrationMarkers?: Array<Record<string, unknown>>,
 * }} SchemaSnapshot
 */

function rows(value) {
  return Array.isArray(value) ? value : [];
}

function valueOf(row, ...names) {
  for (const name of names) {
    if (row && row[name] !== undefined) return row[name];
  }
  return undefined;
}

function normalized(value) {
  return String(value ?? "")
    .replaceAll('"', "")
    .replace(/\bpublic\./g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function hasNamedRow(collection, tableName, objectName) {
  return rows(collection).some((row) => {
    const rowTable = valueOf(row, "table_name", "table", "tablename");
    const rowName = valueOf(
      row,
      "constraint_name",
      "index_name",
      "indexname",
      "routine_name",
      "trigger_name",
      "name",
    );
    return (!tableName || rowTable === tableName) && rowName === catalogIdentifier(objectName);
  });
}

function hasIndex(snapshot, check) {
  return rows(snapshot.indexes).some((row) => {
    const rowTable = valueOf(row, "table_name", "table", "tablename");
    const rowName = valueOf(row, "index_name", "indexname", "name");
    if (rowTable !== check.table || rowName !== catalogIdentifier(check.name)) {
      return false;
    }
    return (check.definitionIncludes ?? []).every((part) =>
      normalized(valueOf(row, "indexdef", "definition")).includes(normalized(part)),
    );
  });
}

function hasTable(snapshot, tableName) {
  return rows(snapshot.tables).some((row) => {
    const rowName = valueOf(row, "table_name", "table", "name");
    return rowName === tableName;
  });
}

function hasColumn(snapshot, check) {
  return rows(snapshot.columns).some((row) => {
    const rowTable = valueOf(row, "table_name", "table");
    const rowColumn = valueOf(row, "column_name", "column", "name");
    if (rowTable !== check.table || rowColumn !== check.column) return false;
    if (check.isNullable === undefined) return true;
    const rowNullable = valueOf(row, "is_nullable", "nullable");
    return normalized(rowNullable) === normalized(check.isNullable);
  });
}

function hasConstraint(snapshot, check) {
  return rows(snapshot.constraints).some((row) => {
    const rowTable = valueOf(row, "table_name", "table");
    const rowName = valueOf(row, "constraint_name", "name");
    if (rowTable !== check.table || rowName !== catalogIdentifier(check.name)) {
      return false;
    }
    return (check.definitionIncludes ?? []).every((part) =>
      normalized(valueOf(row, "definition", "constraint_definition")).includes(normalized(part)),
    );
  });
}

function hasPublicationTable(snapshot, check) {
  return rows(snapshot.publicationTables).some((row) => {
    return (
      valueOf(row, "pubname", "publication") === check.publication &&
      valueOf(row, "schemaname", "schema") === check.schema &&
      valueOf(row, "tablename", "table_name", "table") === check.table
    );
  });
}

const CHECK_HANDLERS = Object.freeze({
  table: (snapshot, check) => hasTable(snapshot, check.table),
  column: (snapshot, check) => hasColumn(snapshot, check),
  constraint: (snapshot, check) => hasConstraint(snapshot, check),
  index: (snapshot, check) => hasIndex(snapshot, check),
  "publication-table": (snapshot, check) => hasPublicationTable(snapshot, check),
  "absent-table": (snapshot, check) => !hasTable(snapshot, check.table),
  "absent-column": (snapshot, check) =>
    !hasColumn({ columns: snapshot.columns }, { ...check, isNullable: undefined }),
  "absent-constraint": (snapshot, check) => !hasConstraint(snapshot, check),
  "absent-index": (snapshot, check) => !hasIndex(snapshot, check),
  "absent-routine": (snapshot, check) =>
    !rows(snapshot.routines).some((row) => valueOf(row, "routine_name", "name") === check.name),
  "absent-trigger": (snapshot, check) => !hasNamedRow(snapshot.triggers, check.table, check.name),
});

function isCheckPresent(snapshot, check) {
  const handler = CHECK_HANDLERS[check.type];
  if (!handler) throw new Error(`Unknown schema verification check type: ${check.type}`);
  return handler(snapshot, check);
}

function migrationMarkerFailures(snapshot, expectedMigrations) {
  if (!Array.isArray(expectedMigrations)) return [];

  const actualMarkers = rows(snapshot.migrationMarkers);
  const expectedVersions = new Set(
    expectedMigrations.map((migration) => Number(migration.version)),
  );
  /** @type {string[]} */
  const missing = [];

  if (expectedMigrations.length > 0 && !hasTable(snapshot, MIGRATION_TRACKING_TABLE)) {
    missing.push(`table:${MIGRATION_TRACKING_TABLE}`);
  }

  for (const migration of expectedMigrations) {
    const version = Number(migration.version);
    const marker = actualMarkers.find((row) => Number(valueOf(row, "version")) === version);
    const markerKey = `migration-marker:${migration.tag}`;
    if (!marker) {
      missing.push(markerKey);
      continue;
    }
    if (
      valueOf(marker, "tag") !== migration.tag ||
      valueOf(marker, "sha256") !== migration.sha256
    ) {
      missing.push(`${markerKey} (tag/checksum mismatch)`);
    }
  }

  for (const marker of actualMarkers) {
    const version = Number(valueOf(marker, "version"));
    if (!expectedVersions.has(version)) {
      missing.push(
        `unexpected-migration-marker:${String(valueOf(marker, "version"))}:${String(valueOf(marker, "tag"))}`,
      );
    }
  }

  return missing;
}

/**
 * Evaluate a catalog snapshot without making any database calls.
 *
 * @param {SchemaSnapshot | { present: Record<string, boolean> }} input
 * @param {{ expectedMigrations?: Array<{ version: number, tag: string, sha256: string }> }} [options]
 * @returns {{ ok: boolean, present: Record<string, boolean>, missing: string[], checked: number }}
 */
export function buildSchemaVerificationResult(input, options = {}) {
  // Accepting the old boolean map makes this helper convenient for callers
  // that only need to format a result, while the production script always
  // passes a full catalog snapshot.
  if (input && input.present && !input.tables && !input.columns) {
    const missing = SCHEMA_CHECKS.filter((check) => input.present[check.key] !== true).map(
      (check) => check.key,
    );
    return {
      ok: missing.length === 0,
      present: input.present,
      missing,
      checked: SCHEMA_CHECKS.length,
    };
  }

  const snapshot = input ?? {};
  /** @type {Record<string, boolean>} */
  const present = {};
  for (const check of SCHEMA_CHECKS) {
    present[check.key] = isCheckPresent(snapshot, check);
  }
  const missing = SCHEMA_CHECKS.filter((check) => !present[check.key]).map((check) => check.key);
  const markerMissing = migrationMarkerFailures(snapshot, options.expectedMigrations);
  missing.push(...markerMissing);
  return {
    ok: missing.length === 0,
    present,
    missing,
    checked: SCHEMA_CHECKS.length + (options.expectedMigrations?.length ?? 0),
  };
}
