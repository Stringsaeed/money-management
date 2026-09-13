import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { chmod, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  buildMaestroEnvironment,
  createMagicAuthHelper,
  eventMatches,
  maestroArgs,
  normalizeRunId,
  requireStagingTarget,
  selectMagicAuthEvent,
  validateMagicAuthDetails,
  writeUserIdOutput,
} = require("./maestro-workos-auth.js");

const RUNNER_PATH = fileURLToPath(new URL("./maestro-workos-auth.js", import.meta.url));
const AUTH_FLOW_PATH = "apps/mobile/e2e/maestro/auth.yaml";

const criteria = {
  email: "trove-maestro@example.com",
  clientId: "client_staging",
  runStartedAtMs: Date.parse("2026-09-13T08:00:00.000Z"),
};

function magicAuthEvent(overrides = {}) {
  return {
    event: "magic_auth.created",
    id: "event_1",
    created_at: "2026-09-13T08:00:01.000Z",
    context: { client_id: criteria.clientId },
    data: {
      id: "magic_auth_1",
      email: criteria.email,
      created_at: "2026-09-13T08:00:01.000Z",
      expires_at: "2026-09-13T08:10:01.000Z",
    },
    ...overrides,
  };
}

test("matches only the requested email, client, and run window", () => {
  const event = magicAuthEvent();
  const nowMs = Date.parse("2026-09-13T08:01:00.000Z");

  assert.equal(eventMatches(event, criteria, nowMs), true);
  assert.equal(
    eventMatches(
      magicAuthEvent({ data: { ...event.data, email: "other@example.com" } }),
      criteria,
      nowMs,
    ),
    false,
  );
  assert.equal(
    eventMatches(magicAuthEvent({ context: { client_id: "client_other" } }), criteria, nowMs),
    false,
  );
  assert.equal(
    eventMatches(magicAuthEvent({ created_at: "2026-09-13T07:59:59.999Z" }), criteria, nowMs),
    false,
  );
});

test("rejects an expired event before retrieving its code", () => {
  const expired = magicAuthEvent({
    data: { ...magicAuthEvent().data, expires_at: "2026-09-13T08:00:30.000Z" },
  });

  assert.equal(
    selectMagicAuthEvent([expired], criteria, Date.parse("2026-09-13T08:00:31.000Z")),
    null,
  );
});

test("fails closed when more than one matching event exists", () => {
  const first = magicAuthEvent();
  const second = magicAuthEvent({
    id: "event_2",
    data: { ...first.data, id: "magic_auth_2" },
  });

  assert.throws(
    () => selectMagicAuthEvent([first, second], criteria, Date.parse("2026-09-13T08:01:00.000Z")),
    { code: "AMBIGUOUS_MAGIC_AUTH" },
  );
});

test("validates the retrieved object against the matched event and expiry", () => {
  const event = magicAuthEvent();
  const details = {
    id: event.data.id,
    email: event.data.email,
    expires_at: "2026-09-13T08:10:01.000Z",
    code: "123456",
    user_id: "user_1",
  };

  assert.equal(
    validateMagicAuthDetails(details, event, Date.parse("2026-09-13T08:01:00.000Z")),
    "123456",
  );
  assert.throws(
    () =>
      validateMagicAuthDetails(
        { ...details, expires_at: "2026-09-13T08:00:30.000Z" },
        event,
        Date.parse("2026-09-13T08:00:31.000Z"),
      ),
    { code: "MAGIC_AUTH_EXPIRED" },
  );
  assert.throws(() => validateMagicAuthDetails({ ...details, id: "magic_auth_other" }, event), {
    code: "MAGIC_AUTH_MISMATCH",
  });
});

test("serves one validated code and closes the loopback endpoint", async () => {
  const event = magicAuthEvent();
  event.data.user_id = "user_1";
  const details = {
    id: event.data.id,
    email: event.data.email,
    expires_at: "2026-09-13T08:10:01.000Z",
    code: "123456",
    user_id: "user_1",
  };
  const upstreamResponses = [
    { ok: true, status: 200, json: async () => ({ data: [event] }) },
    { ok: true, status: 200, json: async () => details },
  ];
  const helper = createMagicAuthHelper({
    apiKey: "synthetic-api-key",
    expectedClientId: criteria.clientId,
    expectedEmail: criteria.email,
    fetchImpl: async () => upstreamResponses.shift(),
    nonce: "n".repeat(32),
    now: () => Date.parse("2026-09-13T08:01:00.000Z"),
  });

  try {
    const url = await helper.listen();
    const request = {
      body: JSON.stringify({
        client_id: criteria.clientId,
        email: criteria.email,
        nonce: "n".repeat(32),
        run_started_at_ms: criteria.runStartedAtMs,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    };
    const response = await fetch(url, request);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { code: "123456" });
    assert.deepEqual(helper.getAuthenticatedUser(), {
      email: criteria.email,
      magicAuthId: event.data.id,
      userId: "user_1",
    });

    const replay = await fetch(url, request);
    assert.equal(replay.status, 410);
  } finally {
    await helper.close();
  }
});

test("serves the approved Gmail QA alias but rejects the personal root address", async () => {
  const email = "stringsaeed+trove_testing@gmail.com";
  const event = magicAuthEvent({ data: { ...magicAuthEvent().data, email, user_id: "user_qa" } });
  const details = {
    id: event.data.id,
    email,
    expires_at: event.data.expires_at,
    code: "123456",
    user_id: "user_qa",
  };
  const responses = [
    { ok: true, status: 200, json: async () => ({ data: [event] }) },
    { ok: true, status: 200, json: async () => details },
  ];
  const configuration = {
    apiKey: "synthetic-api-key",
    expectedClientId: criteria.clientId,
    nonce: "n".repeat(32),
    now: () => Date.parse("2026-09-13T08:01:00.000Z"),
    fetchImpl: async () => responses.shift(),
  };
  assert.throws(
    () => createMagicAuthHelper({ ...configuration, expectedEmail: "stringsaeed@gmail.com" }),
    { code: "INVALID_HELPER_CONFIGURATION" },
  );

  const helper = createMagicAuthHelper({ ...configuration, expectedEmail: email });
  try {
    const url = await helper.listen();
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: criteria.clientId,
        email,
        nonce: configuration.nonce,
        run_started_at_ms: criteria.runStartedAtMs,
      }),
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { code: "123456" });
  } finally {
    await helper.close();
  }
});

test("keeps the child environment narrow and owns debug output cleanup", () => {
  const environment = buildMaestroEnvironment({
    expectedClientId: criteria.clientId,
    expectedEmail: criteria.email,
    helperNonce: "n".repeat(32),
    helperUrl: "http://127.0.0.1:1234/magic-auth-code",
    runId: "123",
  });

  assert.equal(environment.WORKOS_API_KEY, undefined);
  assert.equal(environment.PLANETSCALE_PASSWORD, undefined);
  assert.equal(environment.MAESTRO_WORKOS_TEST_EMAIL, criteria.email);
  assert.equal(environment.RUN_ID, "123");
  assert.equal(environment.MAESTRO_RUN_ID, "123");
  assert.deepEqual(maestroArgs(["--udid", "simulator", AUTH_FLOW_PATH], "/tmp/auth-debug"), [
    "test",
    "--debug-output",
    "/tmp/auth-debug",
    "--udid",
    "simulator",
    AUTH_FLOW_PATH,
  ]);
  assert.throws(() => maestroArgs(["test", "--debug-output", "/persisted"], "/tmp/auth-debug"), {
    code: "DEBUG_OUTPUT_OVERRIDE_FORBIDDEN",
  });
  assert.throws(
    () =>
      maestroArgs(
        ["--udid", "simulator", "-e", "WORKOS_API_KEY=secret", AUTH_FLOW_PATH],
        "/tmp/auth-debug",
      ),
    { code: "INVALID_MAESTRO_ARGUMENTS" },
  );
});

test("accepts only positive safe integer run IDs", () => {
  assert.equal(normalizeRunId("123"), "123");
  assert.equal(normalizeRunId(undefined), null);
  assert.throws(() => normalizeRunId("0"), { code: "INVALID_RUN_ID" });
  assert.throws(() => normalizeRunId("not-a-number"), { code: "INVALID_RUN_ID" });
});

test("requires an explicit staging target", () => {
  assert.equal(requireStagingTarget("staging"), "staging");
  assert.throws(() => requireStagingTarget(undefined), { code: "MISSING_WORKOS_TARGET" });
  assert.throws(() => requireStagingTarget("production"), {
    code: "WORKOS_TARGET_MUST_BE_STAGING",
  });
});

test("writes only the authenticated WorkOS user id with owner-only permissions", async () => {
  const directory = await mkdtemp(join(tmpdir(), "maestro-auth-user-id-test-"));
  const outputPath = join(directory, "user-id");

  try {
    await writeUserIdOutput(outputPath, "user_1");
    assert.equal(await readFile(outputPath, "utf8"), "user_1\n");
    assert.equal((await stat(outputPath)).mode & 0o777, 0o600);
    await assert.rejects(() => writeUserIdOutput(outputPath, "user_2"), {
      code: "USER_ID_OUTPUT_FAILED",
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("main runner gives Maestro only an allowlisted environment and redacted logs", async () => {
  const directory = await mkdtemp(join(tmpdir(), "maestro-auth-runner-test-"));
  const probePath = join(directory, "probe.json");
  const fakeMaestroPath = join(directory, "fake-maestro");
  const fakeMaestroSource = `#!/usr/bin/env node
const fs = require("node:fs");
fs.writeFileSync(${JSON.stringify(probePath)}, JSON.stringify({
  args: process.argv.slice(2),
  env: {
    apiKey: process.env.WORKOS_API_KEY ?? null,
    cloudflareToken: process.env.CLOUDFLARE_API_TOKEN ?? null,
    databaseUrl: process.env.DATABASE_URL ?? null,
    helperNonce: process.env.MAESTRO_WORKOS_HELPER_NONCE ?? null,
    helperUrl: process.env.MAESTRO_WORKOS_HELPER_URL ?? null,
    prefixedApiKey: process.env.MAESTRO_WORKOS_STAGING_API_KEY ?? null,
    planetscalePassword: process.env.PLANETSCALE_PASSWORD ?? null,
  }
}));
console.log("fake-maestro-ok");
`;

  try {
    await writeFile(fakeMaestroPath, fakeMaestroSource, "utf8");
    await chmod(fakeMaestroPath, 0o755);

    const childEnvironment = {
      ...process.env,
      CLOUDFLARE_API_TOKEN: "cloud-secret",
      DATABASE_URL: "postgresql://user:database-secret@example.test/trove",
      MAESTRO_BIN: fakeMaestroPath,
      MAESTRO_WORKOS_STAGING_API_KEY: "prefixed-secret",
      PLANETSCALE_PASSWORD: "planet-secret",
      WORKOS_API_KEY: "workos-secret",
      WORKOS_CLIENT_ID: "client_staging",
      WORKOS_TARGET: "staging",
      WORKOS_TEST_EMAIL: "trove-maestro@example.com",
    };
    delete childEnvironment.WORKOS_USER_ID_OUTPUT;

    const child = spawn(process.execPath, [RUNNER_PATH, "--udid", "simulator", AUTH_FLOW_PATH], {
      cwd: process.cwd(),
      env: childEnvironment,
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    const result = await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("close", (code, signal) => resolve({ code, signal }));
    });

    assert.deepEqual(result, { code: 0, signal: null });
    const logs = Buffer.concat([...stdout, ...stderr]).toString("utf8");
    for (const secret of [
      "workos-secret",
      "cloud-secret",
      "database-secret",
      "planet-secret",
      "prefixed-secret",
    ]) {
      assert.doesNotMatch(logs, new RegExp(secret));
    }
    const probe = JSON.parse(await readFile(probePath, "utf8"));
    assert.equal(probe.env.apiKey, null);
    assert.equal(probe.env.cloudflareToken, null);
    assert.equal(probe.env.databaseUrl, null);
    assert.equal(probe.env.prefixedApiKey, null);
    assert.equal(probe.env.planetscalePassword, null);
    assert.match(probe.env.helperUrl, /^http:\/\/127\.0\.0\.1:\d+\/magic-auth-code$/);
    assert.match(probe.env.helperNonce, /^[a-f0-9]{64}$/);
    assert.equal(probe.args[0], "test");
    assert.equal(probe.args[1], "--debug-output");
    assert.equal(probe.args[3], "--udid");
    assert.equal(probe.args[4], "simulator");
    assert.equal(probe.args[5], AUTH_FLOW_PATH);
    assert.equal(await stat(probe.args[2]).catch(() => null), null);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});
