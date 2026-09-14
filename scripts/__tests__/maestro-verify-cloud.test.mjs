import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CloudVerificationError,
  connectionStringFromEnvironment,
  parseVerifierOptions,
  readCountRow,
  validateResourceCounts,
  verifyCloudResources,
} from "./maestro-verify-cloud.mjs";

const RUN_ID = "1726212345678";
const OWNER_ID = "user_01MAESTRO";

function rowsFor({ exactCount, personalCount, outOfScopeCount }) {
  return {
    exact_count: exactCount,
    personal_count: personalCount,
    out_of_scope_count: outOfScopeCount,
  };
}

function mockedDatabase(row) {
  const calls = [];
  const sql = (strings, ...values) => {
    const statement = strings.join("?").trim();
    calls.push({ statement, values });
    return [row];
  };
  return { calls, sql };
}

test("pre-auth verifies all exact labels are absent", async () => {
  const database = mockedDatabase(rowsFor({ exactCount: 0, personalCount: 0, outOfScopeCount: 0 }));

  const result = await verifyCloudResources(database.sql, {
    phase: "pre-auth",
    runId: RUN_ID,
    runLabel: "local",
    personalUserId: null,
  });

  assert.equal(result.ok, true);
  assert.deepEqual(
    result.resources.map(({ key, label, labelField }) => ({ key, label, labelField })),
    [
      {
        key: "account",
        label: `Maestro local Checking ${RUN_ID}`,
        labelField: "name",
      },
      {
        key: "category",
        label: `Maestro local Groceries ${RUN_ID}`,
        labelField: "name",
      },
      { key: "transaction", label: `LTX ${RUN_ID}`, labelField: "description" },
    ],
  );
  assert.deepEqual(
    database.calls.map((call) => call.values.at(-1)),
    [`Maestro local Checking ${RUN_ID}`, `Maestro local Groceries ${RUN_ID}`, `LTX ${RUN_ID}`],
  );
});

test("pre-auth fails when a local label already exists in cloud", async () => {
  const database = mockedDatabase(rowsFor({ exactCount: 1, personalCount: 0, outOfScopeCount: 1 }));

  const result = await verifyCloudResources(database.sql, {
    phase: "pre-auth",
    runId: RUN_ID,
    runLabel: "local",
    personalUserId: null,
  });

  assert.equal(result.ok, false);
  assert.equal(result.resources[0].exactCount, 1);
  assert.match(result.failures[0], /account .*expected exact count 0, got 1/);
});

test("post-auth requires one exact row in the owned personal ledger", async () => {
  const database = mockedDatabase(rowsFor({ exactCount: 1, personalCount: 1, outOfScopeCount: 0 }));

  const result = await verifyCloudResources(database.sql, {
    phase: "post-auth",
    runId: RUN_ID,
    runLabel: "personal",
    personalUserId: OWNER_ID,
  });

  assert.equal(result.ok, true);
  assert.equal("personalLedgerId" in result, false);
  assert.deepEqual(
    result.resources.map(({ exactCount, personalCount, outOfScopeCount }) => ({
      exactCount,
      personalCount,
      outOfScopeCount,
    })),
    [
      { exactCount: 1, personalCount: 1, outOfScopeCount: 0 },
      { exactCount: 1, personalCount: 1, outOfScopeCount: 0 },
      { exactCount: 1, personalCount: 1, outOfScopeCount: 0 },
    ],
  );
  for (const call of database.calls) {
    assert.match(call.statement, /^SELECT\b/i);
    assert.match(call.statement, /household_id IS NULL/);
    assert.match(call.statement, /kind = 'personal'/);
    assert.ok(call.values.includes(`personal:${OWNER_ID}`));
    assert.ok(call.values.includes(OWNER_ID));
  }
});

test("post-auth rejects duplicates and rows outside the personal scope", async () => {
  const duplicate = validateResourceCounts(
    { exactCount: 2, personalCount: 2, outOfScopeCount: 0 },
    "post-auth",
  );
  assert.equal(duplicate.ok, false);
  assert.match(duplicate.failures[0], /expected exact count 1, got 2/);

  const wrongScope = validateResourceCounts(
    { exactCount: 1, personalCount: 0, outOfScopeCount: 1 },
    "post-auth",
  );
  assert.equal(wrongScope.ok, false);
  assert.deepEqual(wrongScope.failures, [
    "expected personal count 1, got 0",
    "expected out-of-scope count 0, got 1",
  ]);
});

test("post-auth fails closed without the authenticated WorkOS user id", async () => {
  const database = mockedDatabase(rowsFor({ exactCount: 1, personalCount: 1, outOfScopeCount: 0 }));

  await assert.rejects(
    verifyCloudResources(database.sql, {
      phase: "post-auth",
      runId: RUN_ID,
      runLabel: "personal",
    }),
    (error) =>
      error instanceof CloudVerificationError && error.code === "PERSONAL_USER_ID_REQUIRED",
  );
  assert.equal(database.calls.length, 0);
});

test("aggregate result parsing rejects missing or malformed rows", () => {
  assert.deepEqual(
    readCountRow([{ exact_count: "0", personal_count: "0", out_of_scope_count: "0" }]),
    { exactCount: 0, personalCount: 0, outOfScopeCount: 0 },
  );
  assert.throws(() => readCountRow([]), { code: "INVALID_COUNT_RESULT" });
  assert.throws(() => readCountRow([null]), { code: "INVALID_COUNT_RESULT" });
  assert.throws(
    () => readCountRow([{ exact_count: "not-a-count", personal_count: 0, out_of_scope_count: 0 }]),
    { code: "INVALID_COUNT_RESULT" },
  );
});

test("options require a positive numeric run and expose safe owner aliases", () => {
  assert.deepEqual(
    parseVerifierOptions(["--phase", "post-auth"], {
      RUN_ID,
      RUN_LABEL: "personal",
      WORKOS_USER_ID: OWNER_ID,
    }),
    {
      phase: "post-auth",
      runId: RUN_ID,
      runLabel: "personal",
      personalUserId: OWNER_ID,
    },
  );
  assert.throws(() => parseVerifierOptions(["pre-auth"], { RUN_ID: "0" }), {
    code: "INVALID_RUN_ID",
  });
  assert.throws(() => parseVerifierOptions(["post-auth"], { RUN_ID }), {
    code: "PERSONAL_USER_ID_REQUIRED",
  });
});

test("connection setup accepts operator-held direct or PlanetScale variables", () => {
  const direct = connectionStringFromEnvironment({
    DATABASE_URL: "postgresql://operator:secret@db.example.test/trove?sslrootcert=%2Ftmp%2Froot",
  });
  assert.match(direct, /^postgresql:\/\/operator:secret@db\.example\.test\/trove/);
  assert.doesNotMatch(direct, /sslrootcert/);

  const planetscale = connectionStringFromEnvironment({
    PLANETSCALE_DATABASE: "trove",
    PLANETSCALE_HOST: "aws.connect.psdb.cloud",
    PLANETSCALE_PASSWORD: "secret",
    PLANETSCALE_PORT: "6432",
    PLANETSCALE_USER: "operator",
  });
  const parsed = new URL(planetscale);
  assert.equal(parsed.hostname, "aws.connect.psdb.cloud");
  assert.equal(parsed.port, "6432");
  assert.equal(parsed.searchParams.get("sslmode"), "prefer");
  assert.equal(parsed.password, "secret");
});

test("cloud verifier source contains only read queries and no unsafe SQL API", () => {
  const source = readFileSync(new URL("./maestro-verify-cloud.mjs", import.meta.url), "utf8");

  assert.doesNotMatch(source, /\.unsafe\s*\(/);
  assert.doesNotMatch(
    source,
    /\b(?:ALTER\s+TABLE|CREATE\s+(?:TABLE|INDEX)|DROP\s+(?:TABLE|INDEX)|INSERT\s+INTO|UPDATE\s+|DELETE\s+FROM|TRUNCATE\s+)/i,
  );
  const database = mockedDatabase(rowsFor({ exactCount: 0, personalCount: 0, outOfScopeCount: 0 }));
  return verifyCloudResources(database.sql, {
    phase: "pre-auth",
    runId: RUN_ID,
    runLabel: "local",
    personalUserId: null,
  }).then(() => {
    for (const statement of database.calls) {
      assert.match(statement.statement, /^SELECT\b/i);
    }
  });
});
