import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import postgres from "postgres";

const PHASES = ["pre-auth", "post-auth"];
const DEFAULT_PORT = "6432";
const DEFAULT_DATABASE = "postgres";

const RESOURCE_DEFINITIONS = [
  {
    key: "account",
    labelField: "name",
    labelFor: (runLabel, runId) => `Maestro ${runLabel} Checking ${runId}`,
    query: accountCounts,
  },
  {
    key: "category",
    labelField: "name",
    labelFor: (runLabel, runId) => `Maestro ${runLabel} Groceries ${runId}`,
    query: categoryCounts,
  },
  {
    key: "transaction",
    labelField: "description",
    labelFor: (runLabel, runId) => `${runLabel.slice(0, 1).toUpperCase()}TX ${runId}`,
    query: transactionCounts,
  },
];

class CloudVerificationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "CloudVerificationError";
    this.code = code;
  }
}

function nonEmpty(value) {
  return Object.prototype.toString.call(value) === "[object String]" && value.trim().length > 0;
}

function requiredEnvironment(name, environment) {
  const value = environment[name];
  if (!nonEmpty(value)) {
    throw new CloudVerificationError(
      `MISSING_${name}`,
      `${name} is required for cloud verification.`,
    );
  }
  return value.trim();
}

function numericRunId(value) {
  if (!nonEmpty(value) || !/^\d+$/.test(value.trim()) || BigInt(value.trim()) <= 0n) {
    throw new CloudVerificationError(
      "INVALID_RUN_ID",
      "RUN_ID must be a positive numeric string shared by both resource sweeps.",
    );
  }
  return value.trim();
}

function phaseValue(value) {
  const phase = value?.trim();
  if (!PHASES.includes(phase)) {
    throw new CloudVerificationError("INVALID_PHASE", "The phase must be pre-auth or post-auth.");
  }
  return phase;
}

function sanitizeConnectionString(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new CloudVerificationError(
      "INVALID_DATABASE_URL",
      "DATABASE_URL is not a valid PostgreSQL connection URL.",
    );
  }

  // sslrootcert is a client-side libpq option and is not accepted by the
  // server. Do not log this URL: it can contain the operator's password.
  url.searchParams.delete("sslrootcert");
  return url.toString();
}

function planetScaleConnectionString(environment) {
  const host = requiredEnvironment("PLANETSCALE_HOST", environment);
  const user = requiredEnvironment("PLANETSCALE_USER", environment);
  const database = environment.PLANETSCALE_DATABASE?.trim() || DEFAULT_DATABASE;
  const port = environment.PLANETSCALE_PORT?.trim() || DEFAULT_PORT;
  if (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
    throw new CloudVerificationError(
      "INVALID_PLANETSCALE_PORT",
      "PLANETSCALE_PORT must be a valid TCP port.",
    );
  }

  let url;
  try {
    url = new URL(
      `postgresql://${encodeURIComponent(user)}@${host}:${port}/${encodeURIComponent(database)}`,
    );
  } catch {
    throw new CloudVerificationError(
      "INVALID_PLANETSCALE_CONNECTION",
      "PLANETSCALE_HOST, PLANETSCALE_DATABASE, and PLANETSCALE_PORT do not form a valid connection URL.",
    );
  }
  url.password = environment.PLANETSCALE_PASSWORD ?? "";
  url.searchParams.set("sslmode", "prefer");
  return url.toString();
}

export function connectionStringFromEnvironment(environment = process.env) {
  const direct = environment.DATABASE_URL?.trim();
  return direct ? sanitizeConnectionString(direct) : planetScaleConnectionString(environment);
}

function ownerFromEnvironment(environment) {
  const owner =
    environment.PERSONAL_USER_ID?.trim() ||
    environment.WORKOS_USER_ID?.trim() ||
    environment.MAESTRO_WORKOS_USER_ID?.trim();
  if (!nonEmpty(owner)) {
    throw new CloudVerificationError(
      "PERSONAL_USER_ID_REQUIRED",
      "Post-auth verification needs PERSONAL_USER_ID (the authenticated WorkOS user id).",
    );
  }
  return owner;
}

function parsePhaseArgument(args) {
  let phase;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--phase") {
      phase = args[index + 1];
      index += 1;
    } else if (argument?.startsWith("--phase=")) {
      phase = argument.slice("--phase=".length);
    } else if (!argument?.startsWith("-") && phase === undefined) {
      phase = argument;
    } else if (argument !== undefined && argument !== "--") {
      throw new CloudVerificationError(
        "INVALID_ARGUMENT",
        "Usage: node scripts/maestro-verify-cloud.mjs --phase pre-auth|post-auth",
      );
    }
  }
  return phase;
}

export function parseVerifierOptions(args = [], environment = process.env) {
  const phase = phaseValue(parsePhaseArgument(args) ?? environment.MAESTRO_CLOUD_PHASE);
  const runId = numericRunId(requiredEnvironment("RUN_ID", environment));
  const defaultLabel = phase === "pre-auth" ? "local" : "personal";
  const runLabel = environment.RUN_LABEL?.trim() || defaultLabel;
  if (!nonEmpty(runLabel)) {
    throw new CloudVerificationError("INVALID_RUN_LABEL", "RUN_LABEL must not be empty.");
  }

  return {
    phase,
    runId,
    runLabel,
    personalUserId: phase === "post-auth" ? ownerFromEnvironment(environment) : null,
  };
}

function personalLedgerId(personalUserId) {
  return personalUserId ? `personal:${personalUserId}` : null;
}

function accountCounts(sql, label, ownerId) {
  const personalId = personalLedgerId(ownerId);
  return sql`
    SELECT
      COUNT(*)::int AS exact_count,
      COUNT(*) FILTER (
        WHERE a.ledger_id = ${personalId}
          AND a.household_id IS NULL
          AND l.kind = 'personal'
          AND l.personal_user_id = ${ownerId}
      )::int AS personal_count,
      COUNT(*) FILTER (
        WHERE NOT (
          a.ledger_id = ${personalId}
          AND a.household_id IS NULL
          AND l.kind = 'personal'
          AND l.personal_user_id = ${ownerId}
        )
      )::int AS out_of_scope_count
    FROM accounts AS a
    LEFT JOIN ledger AS l ON l.id = a.ledger_id
    WHERE a.name = ${label}
  `;
}

function categoryCounts(sql, label, ownerId) {
  const personalId = personalLedgerId(ownerId);
  return sql`
    SELECT
      COUNT(*)::int AS exact_count,
      COUNT(*) FILTER (
        WHERE c.ledger_id = ${personalId}
          AND c.household_id IS NULL
          AND l.kind = 'personal'
          AND l.personal_user_id = ${ownerId}
      )::int AS personal_count,
      COUNT(*) FILTER (
        WHERE NOT (
          c.ledger_id = ${personalId}
          AND c.household_id IS NULL
          AND l.kind = 'personal'
          AND l.personal_user_id = ${ownerId}
        )
      )::int AS out_of_scope_count
    FROM categories AS c
    LEFT JOIN ledger AS l ON l.id = c.ledger_id
    WHERE c.name = ${label}
  `;
}

function transactionCounts(sql, label, ownerId) {
  const personalId = personalLedgerId(ownerId);
  return sql`
    SELECT
      COUNT(*)::int AS exact_count,
      COUNT(*) FILTER (
        WHERE t.ledger_id = ${personalId}
          AND t.household_id IS NULL
          AND l.kind = 'personal'
          AND l.personal_user_id = ${ownerId}
      )::int AS personal_count,
      COUNT(*) FILTER (
        WHERE NOT (
          t.ledger_id = ${personalId}
          AND t.household_id IS NULL
          AND l.kind = 'personal'
          AND l.personal_user_id = ${ownerId}
        )
      )::int AS out_of_scope_count
    FROM transactions AS t
    LEFT JOIN ledger AS l ON l.id = t.ledger_id
    WHERE t.description = ${label}
  `;
}

function asCount(value, field) {
  const count =
    Object.prototype.toString.call(value) === "[object Number]"
      ? value
      : Object.prototype.toString.call(value) === "[object String]" && /^\d+$/.test(value)
        ? Number(value)
        : NaN;
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new CloudVerificationError(
      "INVALID_COUNT_RESULT",
      `Database returned an invalid ${field} count.`,
    );
  }
  return count;
}

function readCountRow(rows) {
  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new CloudVerificationError(
      "INVALID_COUNT_RESULT",
      "Each resource query must return exactly one aggregate row.",
    );
  }
  const row = rows[0];
  if (Object.prototype.toString.call(row) !== "[object Object]") {
    throw new CloudVerificationError(
      "INVALID_COUNT_RESULT",
      "Each resource query must return an aggregate object.",
    );
  }
  return {
    exactCount: asCount(row.exact_count, "exact"),
    personalCount: asCount(row.personal_count, "personal"),
    outOfScopeCount: asCount(row.out_of_scope_count, "out-of-scope"),
  };
}

export function validateResourceCounts(counts, phase) {
  const expectedExactCount = phase === "pre-auth" ? 0 : 1;
  const failures = [];
  if (counts.exactCount !== expectedExactCount) {
    failures.push(`expected exact count ${expectedExactCount}, got ${counts.exactCount}`);
  }
  if (phase === "post-auth") {
    if (counts.personalCount !== 1) {
      failures.push(`expected personal count 1, got ${counts.personalCount}`);
    }
    if (counts.outOfScopeCount !== 0) {
      failures.push(`expected out-of-scope count 0, got ${counts.outOfScopeCount}`);
    }
  }
  return { ...counts, failures, ok: failures.length === 0 };
}

export async function verifyCloudResources(sql, options) {
  const phase = phaseValue(options.phase);
  const runId = numericRunId(options.runId);
  const runLabel = options.runLabel?.trim();
  if (!nonEmpty(runLabel)) {
    throw new CloudVerificationError("INVALID_RUN_LABEL", "RUN_LABEL must not be empty.");
  }
  const ownerId =
    phase === "post-auth"
      ? ownerFromEnvironment({ PERSONAL_USER_ID: options.personalUserId })
      : null;
  const resources = [];
  for (const definition of RESOURCE_DEFINITIONS) {
    const label = definition.labelFor(runLabel, runId);
    const counts = readCountRow(await definition.query(sql, label, ownerId));
    const checked = validateResourceCounts(counts, phase);
    resources.push({
      key: definition.key,
      label,
      labelField: definition.labelField,
      ...checked,
    });
  }
  const failures = resources.flatMap((resource) =>
    resource.failures.map((failure) => `${resource.key} (${resource.label}): ${failure}`),
  );
  return {
    ok: failures.length === 0,
    phase,
    runId,
    runLabel,
    resources,
    failures,
  };
}

function databaseErrorCode(error) {
  if (!(error instanceof Error)) return "";
  const code = "code" in error ? error.code : undefined;
  return code ? String(code) : "";
}

function verificationErrorCode(error) {
  return databaseErrorCode(error) || (error instanceof CloudVerificationError ? error.code : "");
}

async function executeVerification({ args, environment, connect }) {
  let client;
  try {
    const options = parseVerifierOptions(args, environment);
    const connectionUrl = connectionStringFromEnvironment(environment);
    client = connect(connectionUrl, { max: 1, ssl: "prefer" });
    const result = await verifyCloudResources(client, options);
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
    return result;
  } finally {
    if (client) await client.end();
  }
}

export async function main({
  args = process.argv.slice(2),
  environment = process.env,
  connect = postgres,
} = {}) {
  try {
    return await executeVerification({ args, connect, environment });
  } catch (error) {
    const code = verificationErrorCode(error);
    console.error(`Maestro cloud verification could not complete${code ? ` (${code})` : ""}.`);
    process.exitCode = 1;
    return null;
  }
}

const isMainModule =
  process.argv[1] !== undefined && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMainModule) {
  await main();
}

export { CloudVerificationError, RESOURCE_DEFINITIONS, readCountRow };
