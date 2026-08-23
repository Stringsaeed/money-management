export const BUDGETING_TABLES = [
  "assignments",
  "budget_workspaces",
  "category_mappings",
  "envelopes",
  "funding_memberships",
  "rollover_settings",
  "setup_drafts",
] as const;

export const REQUIRED_BUDGETING_COLUMNS: Record<
  (typeof BUDGETING_TABLES)[number],
  readonly string[]
> = {
  assignments: [
    "id",
    "currency",
    "budget_period",
    "source_envelope_id",
    "destination_envelope_id",
    "amount_minor",
    "reverses_assignment_id",
    "created_at",
  ],
  budget_workspaces: ["currency", "activation_period", "created_at", "updated_at"],
  category_mappings: [
    "category_id",
    "envelope_id",
    "effective_from_period",
    "effective_to_period",
    "created_at",
  ],
  envelopes: [
    "id",
    "currency",
    "name",
    "icon",
    "color",
    "lifecycle",
    "sort_order",
    "created_at",
    "updated_at",
  ],
  funding_memberships: [
    "account_id",
    "currency",
    "effective_from_period",
    "effective_to_period",
    "created_at",
  ],
  rollover_settings: ["envelope_id", "effective_from_period", "positive_rollover", "created_at"],
  setup_drafts: ["id", "payload", "created_at", "updated_at"],
};

export const CREATE_BUDGETING_SCHEMA_SQL = `
  CREATE TABLE budget_workspaces (
    currency TEXT PRIMARY KEY NOT NULL,
    activation_period TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE funding_memberships (
    account_id TEXT NOT NULL,
    currency TEXT NOT NULL,
    effective_from_period TEXT NOT NULL,
    effective_to_period TEXT,
    created_at TEXT NOT NULL,
    PRIMARY KEY (account_id, effective_from_period),
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    FOREIGN KEY (currency) REFERENCES budget_workspaces(currency) ON DELETE RESTRICT,
    CHECK (effective_to_period IS NULL OR effective_to_period >= effective_from_period)
  );

  CREATE TABLE envelopes (
    id TEXT PRIMARY KEY NOT NULL,
    currency TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    lifecycle TEXT NOT NULL DEFAULT 'active',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (currency) REFERENCES budget_workspaces(currency) ON DELETE RESTRICT,
    CHECK (lifecycle IN ('active', 'archived'))
  );

  CREATE TABLE category_mappings (
    category_id TEXT NOT NULL,
    envelope_id TEXT NOT NULL,
    effective_from_period TEXT NOT NULL,
    effective_to_period TEXT,
    created_at TEXT NOT NULL,
    PRIMARY KEY (category_id, effective_from_period),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (envelope_id) REFERENCES envelopes(id) ON DELETE RESTRICT,
    CHECK (effective_to_period IS NULL OR effective_to_period >= effective_from_period)
  );

  CREATE TABLE assignments (
    id TEXT PRIMARY KEY NOT NULL,
    currency TEXT NOT NULL,
    budget_period TEXT NOT NULL,
    source_envelope_id TEXT,
    destination_envelope_id TEXT,
    amount_minor INTEGER NOT NULL,
    reverses_assignment_id TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (currency) REFERENCES budget_workspaces(currency) ON DELETE RESTRICT,
    FOREIGN KEY (source_envelope_id) REFERENCES envelopes(id) ON DELETE RESTRICT,
    FOREIGN KEY (destination_envelope_id) REFERENCES envelopes(id) ON DELETE RESTRICT,
    FOREIGN KEY (reverses_assignment_id) REFERENCES assignments(id) ON DELETE RESTRICT,
    CHECK (amount_minor > 0),
    CHECK (source_envelope_id IS NOT NULL OR destination_envelope_id IS NOT NULL),
    CHECK (
      source_envelope_id IS NULL
      OR destination_envelope_id IS NULL
      OR source_envelope_id <> destination_envelope_id
    )
  );

  CREATE TABLE rollover_settings (
    envelope_id TEXT NOT NULL,
    effective_from_period TEXT NOT NULL,
    positive_rollover INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    PRIMARY KEY (envelope_id, effective_from_period),
    FOREIGN KEY (envelope_id) REFERENCES envelopes(id) ON DELETE RESTRICT,
    CHECK (positive_rollover IN (0, 1))
  );

  CREATE TABLE setup_drafts (
    id TEXT PRIMARY KEY NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;
