import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  buildMaestroEnvironment,
  createMagicAuthHelper,
  eventMatches,
  maestroArgs,
  normalizeRunId,
  selectMagicAuthEvent,
  validateMagicAuthDetails,
} = require("./maestro-workos-auth.js");

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
  assert.deepEqual(maestroArgs(["--udid", "simulator", "flow.yaml"], "/tmp/auth-debug"), [
    "test",
    "--debug-output",
    "/tmp/auth-debug",
    "--udid",
    "simulator",
    "flow.yaml",
  ]);
  assert.throws(() => maestroArgs(["test", "--debug-output", "/persisted"], "/tmp/auth-debug"), {
    code: "DEBUG_OUTPUT_OVERRIDE_FORBIDDEN",
  });
});

test("accepts only positive safe integer run IDs", () => {
  assert.equal(normalizeRunId("123"), "123");
  assert.equal(normalizeRunId(undefined), null);
  assert.throws(() => normalizeRunId("0"), { code: "INVALID_RUN_ID" });
  assert.throws(() => normalizeRunId("not-a-number"), { code: "INVALID_RUN_ID" });
});
