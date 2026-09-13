/*
 * Usage (export values in the shell, never put the API key in CLI arguments):
 *   export WORKOS_API_KEY=...
 *   export WORKOS_TEST_EMAIL=trove-maestro@example.com
 *   export WORKOS_CLIENT_ID=client_...
 *   export WORKOS_TARGET=staging
 *   export WORKOS_USER_ID_OUTPUT=/tmp/trove-workos-user-id
 *   node scripts/maestro-workos-auth.js --udid <simulator> apps/mobile/e2e/maestro/auth.yaml
 *
 * WORKOS_TARGET is intentionally required and must be staging. The runner
 * does not infer an environment from a key prefix or endpoint name.
 */

const { Buffer } = require("node:buffer");
const { randomBytes, timingSafeEqual } = require("node:crypto");
const { spawn } = require("node:child_process");
const { mkdtemp, open, rm } = require("node:fs/promises");
const { createServer } = require("node:http");
const { tmpdir } = require("node:os");
const { dirname, isAbsolute, join, resolve } = require("node:path");

const WORKOS_API_ORIGIN = "https://api.workos.com";
const MAGIC_AUTH_EVENT = "magic_auth.created";
const HELPER_PATH = "/magic-auth-code";
const EVENT_PAGE_LIMIT = 100;
const EVENT_POLL_INTERVAL_MS = 500;
const EVENT_POLL_TIMEOUT_MS = 30_000;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_REQUEST_BYTES = 16 * 1024;
const AUTH_FLOW_PATH = resolve(
  dirname(require.resolve("./maestro-workos-auth.js")),
  "../apps/mobile/e2e/maestro/auth.yaml",
);

class AuthHelperError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

function fail(code) {
  return new AuthHelperError(code);
}

function isRecord(value) {
  return value !== null && Object.prototype.toString.call(value) === "[object Object]";
}

function isText(value) {
  return Object.prototype.toString.call(value) === "[object String]" && value.trim().length > 0;
}

function isExampleEmail(value) {
  return isText(value) && /^\S+@example\.com$/.test(value);
}

function parseTimestamp(value) {
  if (!isText(value)) return null;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) ? milliseconds : null;
}

function normalizeRequest(value) {
  if (!isRecord(value)) throw fail("INVALID_REQUEST");

  const email = value.email;
  const clientId = value.client_id;
  const nonce = value.nonce;
  const runStartedAtMs = value.run_started_at_ms;
  if (
    !isExampleEmail(email) ||
    !isText(clientId) ||
    !isText(nonce) ||
    nonce.length < 32 ||
    !Number.isSafeInteger(runStartedAtMs) ||
    runStartedAtMs <= 0
  ) {
    throw fail("INVALID_REQUEST");
  }
  return { clientId: clientId.trim(), email, nonce, runStartedAtMs };
}

function eventMatches(event, criteria, nowMs) {
  if (!eventIdentityMatches(event, criteria)) return false;

  const times = eventTimes(event);
  return (
    times !== null &&
    times.eventCreatedAtMs >= criteria.runStartedAtMs &&
    times.dataCreatedAtMs >= criteria.runStartedAtMs &&
    times.expiresAtMs > nowMs
  );
}

function eventIdentityMatches(event, criteria) {
  return (
    isRecord(event) &&
    event.event === MAGIC_AUTH_EVENT &&
    isRecord(event.data) &&
    isRecord(event.context) &&
    event.data.email === criteria.email &&
    event.context.client_id === criteria.clientId
  );
}

function eventTimes(event) {
  const eventCreatedAtMs = parseTimestamp(event.created_at);
  const dataCreatedAtMs = parseTimestamp(event.data.created_at);
  const expiresAtMs = parseTimestamp(event.data.expires_at);
  if (eventCreatedAtMs === null || dataCreatedAtMs === null || expiresAtMs === null) return null;
  return { dataCreatedAtMs, eventCreatedAtMs, expiresAtMs };
}

function selectMagicAuthEvent(events, criteria, nowMs = Date.now()) {
  if (!Array.isArray(events)) throw fail("INVALID_EVENTS_RESPONSE");
  const matches = events.filter((event) => eventMatches(event, criteria, nowMs));
  if (matches.length === 0) return null;
  if (matches.length !== 1) throw fail("AMBIGUOUS_MAGIC_AUTH");
  if (!isRecord(matches[0].data) || !isText(matches[0].data.id)) {
    throw fail("INVALID_MAGIC_AUTH_EVENT");
  }
  return matches[0];
}

function validateMagicAuthDetails(details, event, nowMs = Date.now()) {
  if (!isRecord(details) || !isRecord(event.data)) throw fail("INVALID_MAGIC_AUTH_RESPONSE");
  if (details.id !== event.data.id || details.email !== event.data.email) {
    throw fail("MAGIC_AUTH_MISMATCH");
  }
  const expiresAtMs = parseTimestamp(details.expires_at);
  if (expiresAtMs === null || expiresAtMs <= nowMs) throw fail("MAGIC_AUTH_EXPIRED");
  if (!isText(details.code) || !/^\d{6}$/.test(details.code)) {
    throw fail("INVALID_MAGIC_AUTH_CODE");
  }
  return details.code;
}

async function fetchJson(fetchImpl, url, apiKey, operation) {
  let response;
  try {
    response = await fetchImpl(url, {
      headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw fail(`${operation}_UNREACHABLE`);
  }
  if (!response.ok) {
    const status = Number.isInteger(response.status) ? response.status : "UNKNOWN";
    throw fail(`${operation}_STATUS_${status}`);
  }
  try {
    return await response.json();
  } catch {
    throw fail(`${operation}_INVALID_JSON`);
  }
}

async function listMagicAuthEvents(fetchImpl, apiKey, criteria) {
  const query = new URLSearchParams({
    events: MAGIC_AUTH_EVENT,
    limit: String(EVENT_PAGE_LIMIT),
    order: "desc",
    range_start: new Date(criteria.runStartedAtMs).toISOString(),
  });
  const payload = await fetchJson(
    fetchImpl,
    `${WORKOS_API_ORIGIN}/events?${query.toString()}`,
    apiKey,
    "EVENTS_REQUEST",
  );
  if (!isRecord(payload) || !Array.isArray(payload.data)) throw fail("INVALID_EVENTS_RESPONSE");
  return payload.data;
}

async function getMagicAuthDetails(fetchImpl, apiKey, magicAuthId) {
  return fetchJson(
    fetchImpl,
    `${WORKOS_API_ORIGIN}/user_management/magic_auth/${encodeURIComponent(magicAuthId)}`,
    apiKey,
    "MAGIC_AUTH_REQUEST",
  );
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForMagicAuthCode({
  apiKey,
  criteria,
  fetchImpl = fetch,
  now = Date.now,
  onAuthenticated,
}) {
  const deadline = now() + EVENT_POLL_TIMEOUT_MS;
  while (now() <= deadline) {
    const code = await pollMagicAuthCode({ apiKey, criteria, fetchImpl, now, onAuthenticated });
    if (code) return code;
    await wait(EVENT_POLL_INTERVAL_MS);
  }
  throw fail("MAGIC_AUTH_TIMEOUT");
}

async function pollMagicAuthCode({ apiKey, criteria, fetchImpl, now, onAuthenticated }) {
  const events = await listMagicAuthEvents(fetchImpl, apiKey, criteria);
  const event = selectMagicAuthEvent(events, criteria, now());
  if (!event) return null;

  const details = await getMagicAuthDetails(fetchImpl, apiKey, event.data.id);
  const code = validateMagicAuthDetails(details, event, now());
  if (
    isText(details.user_id) &&
    isText(event.data.user_id) &&
    details.user_id !== event.data.user_id
  ) {
    throw fail("MAGIC_AUTH_MISMATCH");
  }
  const userId = details.user_id || event.data.user_id;
  if (isText(userId)) {
    onAuthenticated?.({ email: details.email, magicAuthId: event.data.id, userId });
  }
  return code;
}

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    "Content-Type": "application/json",
  });
  response.end(body);
}

async function readRequestBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_REQUEST_BYTES) throw fail("REQUEST_TOO_LARGE");
  }
  try {
    return JSON.parse(body);
  } catch {
    throw fail("INVALID_REQUEST");
  }
}

function nonceMatches(received, expected) {
  if (!isText(received) || received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

async function writeUserIdOutput(filePath, userId) {
  if (
    !isText(filePath) ||
    !isAbsolute(filePath) ||
    !isText(userId) ||
    !/^user_[A-Za-z0-9]+$/.test(userId)
  ) {
    throw fail("INVALID_USER_ID_OUTPUT");
  }

  let handle;
  try {
    handle = await open(filePath, "wx", 0o600);
    await handle.writeFile(`${userId}\n`, "utf8");
    await handle.chmod(0o600);
  } catch {
    throw fail("USER_ID_OUTPUT_FAILED");
  } finally {
    if (handle) await handle.close().catch(() => undefined);
  }
}

function createMagicAuthHelper({
  apiKey,
  expectedEmail,
  expectedClientId,
  nonce,
  fetchImpl = fetch,
  now = Date.now,
  onAuthenticated,
}) {
  if (
    !isText(apiKey) ||
    !isExampleEmail(expectedEmail) ||
    !isText(expectedClientId) ||
    !isText(nonce) ||
    nonce.length < 32
  ) {
    throw fail("INVALID_HELPER_CONFIGURATION");
  }

  const state = { apiKey, consumed: false, authenticatedUser: null };
  const recordAuthenticated = (identity) => {
    state.authenticatedUser = identity;
    onAuthenticated?.(identity);
  };
  const server = createServer((request, response) => {
    void handleRequest({
      expectedClientId,
      expectedEmail,
      fetchImpl,
      nonce,
      now,
      onAuthenticated: recordAuthenticated,
      request,
      response,
      state,
    }).catch(() => {
      if (!response.writableEnded) sendJson(response, 502, { error: "HELPER_FAILED" });
    });
  });

  return {
    close() {
      state.consumed = true;
      state.apiKey = "";
      return new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
    getAuthenticatedUser() {
      return state.authenticatedUser;
    },
    listen() {
      return new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", () => {
          server.off("error", reject);
          const address = server.address();
          if (!address || !Number.isInteger(address.port)) {
            reject(fail("HELPER_ADDRESS_UNAVAILABLE"));
            return;
          }
          resolve(`http://127.0.0.1:${address.port}${HELPER_PATH}`);
        });
      });
    },
  };
}

async function handleRequest({
  request,
  response,
  state,
  expectedEmail,
  expectedClientId,
  nonce,
  fetchImpl,
  now,
  onAuthenticated,
}) {
  if (request.method !== "POST" || request.url !== HELPER_PATH) {
    sendJson(response, 404, { error: "NOT_FOUND" });
    return;
  }
  if (state.consumed) {
    sendJson(response, 410, { error: "HELPER_CLOSED" });
    return;
  }

  state.consumed = true;
  try {
    const input = normalizeRequest(await readRequestBody(request));
    if (
      !nonceMatches(input.nonce, nonce) ||
      input.email !== expectedEmail ||
      input.clientId !== expectedClientId
    ) {
      sendJson(response, 401, { error: "UNAUTHORIZED" });
      return;
    }
    const code = await waitForMagicAuthCode({
      apiKey: state.apiKey,
      criteria: input,
      fetchImpl,
      now,
      onAuthenticated,
    });
    sendJson(response, 200, { code });
  } catch (error) {
    sendJson(response, 502, { error: error?.code ?? "HELPER_FAILED" });
  }
}

function requiredEnvironment(name, value) {
  if (!isText(value)) throw fail(`MISSING_${name}`);
  return value.trim();
}

function requireStagingTarget(value) {
  const target = requiredEnvironment("WORKOS_TARGET", value);
  if (target !== "staging") throw fail("WORKOS_TARGET_MUST_BE_STAGING");
  return target;
}

function optionalUserIdOutput(value) {
  if (!isText(value)) return null;
  if (!isAbsolute(value)) throw fail("USER_ID_OUTPUT_MUST_BE_ABSOLUTE");
  return value.trim();
}

function copyEnvironmentValue(target, name, value) {
  if (isText(value)) target[name] = value;
}

function buildMaestroEnvironment({
  expectedClientId,
  expectedEmail,
  helperNonce,
  helperUrl,
  runId,
}) {
  const environment = {};
  copyEnvironmentValue(environment, "PATH", process.env.PATH);
  copyEnvironmentValue(environment, "HOME", process.env.HOME);
  copyEnvironmentValue(environment, "TMPDIR", process.env.TMPDIR);
  copyEnvironmentValue(environment, "TMP", process.env.TMP);
  copyEnvironmentValue(environment, "TEMP", process.env.TEMP);
  copyEnvironmentValue(environment, "LANG", process.env.LANG);
  copyEnvironmentValue(environment, "LC_ALL", process.env.LC_ALL);
  copyEnvironmentValue(environment, "LC_CTYPE", process.env.LC_CTYPE);
  copyEnvironmentValue(environment, "TERM", process.env.TERM);
  copyEnvironmentValue(environment, "CI", process.env.CI);
  copyEnvironmentValue(environment, "DEVELOPER_DIR", process.env.DEVELOPER_DIR);
  copyEnvironmentValue(environment, "JAVA_HOME", process.env.JAVA_HOME);
  copyEnvironmentValue(environment, "ANDROID_HOME", process.env.ANDROID_HOME);
  copyEnvironmentValue(environment, "ANDROID_SDK_ROOT", process.env.ANDROID_SDK_ROOT);
  copyEnvironmentValue(
    environment,
    "MAESTRO_CLI_NO_ANALYTICS",
    process.env.MAESTRO_CLI_NO_ANALYTICS,
  );
  copyEnvironmentValue(
    environment,
    "MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED",
    process.env.MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED,
  );
  copyEnvironmentValue(
    environment,
    "MAESTRO_CLI_LOG_PATTERN_CONSOLE",
    process.env.MAESTRO_CLI_LOG_PATTERN_CONSOLE,
  );
  copyEnvironmentValue(
    environment,
    "MAESTRO_DRIVER_STARTUP_TIMEOUT",
    process.env.MAESTRO_DRIVER_STARTUP_TIMEOUT,
  );
  environment.MAESTRO_WORKOS_CLIENT_ID = expectedClientId;
  environment.MAESTRO_WORKOS_HELPER_NONCE = helperNonce;
  environment.MAESTRO_WORKOS_HELPER_URL = helperUrl;
  environment.MAESTRO_WORKOS_TEST_EMAIL = expectedEmail;
  if (runId) {
    environment.MAESTRO_RUN_ID = runId;
    environment.RUN_ID = runId;
  }
  return environment;
}

function normalizeRunId(value) {
  if (!isText(value)) return null;
  const runId = Number(value);
  if (!Number.isSafeInteger(runId) || runId <= 0) throw new AuthHelperError("INVALID_RUN_ID");
  return String(runId);
}

function parseMaestroArgs(args) {
  const input = args[0] === "test" ? args.slice(1) : args;
  let flow;
  let udid;
  for (let index = 0; index < input.length; index += 1) {
    const argument = input[index];
    const device = parseDeviceArgument(input, index);
    if (device) {
      if (udid) throw fail("INVALID_MAESTRO_ARGUMENTS");
      udid = device.udid;
      index = device.nextIndex;
      continue;
    }
    if (resolve(argument) === AUTH_FLOW_PATH) {
      if (flow) throw fail("INVALID_MAESTRO_ARGUMENTS");
      flow = argument;
      continue;
    }
    throw fail("INVALID_MAESTRO_ARGUMENTS");
  }
  if (!udid || !flow) throw fail("AUTH_FLOW_AND_UDID_REQUIRED");
  return { flow, udid };
}

function parseDeviceArgument(input, index) {
  const argument = input[index];
  if (argument === "--udid" || argument === "--device") {
    const udid = input[index + 1];
    if (!isText(udid) || udid.startsWith("-") || udid.includes(",")) {
      throw fail("INVALID_MAESTRO_ARGUMENTS");
    }
    return { nextIndex: index + 1, udid };
  }
  if (argument.startsWith("--udid=") || argument.startsWith("--device=")) {
    const udid = argument.slice(argument.indexOf("=") + 1);
    if (!isText(udid) || udid.includes(",")) throw fail("INVALID_MAESTRO_ARGUMENTS");
    return { nextIndex: index, udid };
  }
  return null;
}

function maestroArgs(args, debugOutput) {
  if (
    args.some((argument) => argument === "--debug-output" || argument.startsWith("--debug-output="))
  ) {
    throw fail("DEBUG_OUTPUT_OVERRIDE_FORBIDDEN");
  }
  const { flow, udid } = parseMaestroArgs(args);
  return ["test", "--debug-output", debugOutput, "--udid", udid, flow];
}

function spawnMaestro(args, environment, debugOutput) {
  const command = process.env.MAESTRO_BIN || "maestro";
  const child = spawn(command, maestroArgs(args, debugOutput), {
    env: environment,
    stdio: "inherit",
  });
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => resolve({ code, signal }));
  });
}

async function run() {
  const apiKey = requiredEnvironment("WORKOS_API_KEY", process.env.WORKOS_API_KEY);
  const expectedEmail = requiredEnvironment("WORKOS_TEST_EMAIL", process.env.WORKOS_TEST_EMAIL);
  const expectedClientId = requiredEnvironment("WORKOS_CLIENT_ID", process.env.WORKOS_CLIENT_ID);
  requireStagingTarget(process.env.WORKOS_TARGET);
  const runId = normalizeRunId(process.env.RUN_ID);
  const userIdOutput = optionalUserIdOutput(process.env.WORKOS_USER_ID_OUTPUT);
  const nonce = randomBytes(32).toString("hex");
  const helper = createMagicAuthHelper({ apiKey, expectedClientId, expectedEmail, nonce });

  // Maestro logs MAESTRO_* variables while defining a flow. Keep the API key
  // and unrelated credentials out of its child environment altogether.
  delete process.env.WORKOS_API_KEY;
  delete process.env.WORKOS_TEST_EMAIL;
  delete process.env.WORKOS_CLIENT_ID;
  delete process.env.RUN_ID;
  delete process.env.MAESTRO_WORKOS_API_KEY;
  delete process.env.MAESTRO_WORKOS_STAGING_API_KEY;

  let debugOutput;
  try {
    const helperUrl = await helper.listen();
    debugOutput = await mkdtemp(join(tmpdir(), "trove-maestro-auth-"));
    const environment = buildMaestroEnvironment({
      expectedClientId,
      expectedEmail,
      helperNonce: nonce,
      helperUrl,
      runId,
    });
    const result = await spawnMaestro(process.argv.slice(2), environment, debugOutput);
    if (!result.signal && result.code === 0 && userIdOutput) {
      const identity = helper.getAuthenticatedUser();
      if (!identity?.userId) throw fail("AUTHENTICATED_USER_ID_MISSING");
      await writeUserIdOutput(userIdOutput, identity.userId);
    }
    if (result.signal) process.exitCode = 1;
    else if (result.code !== 0) process.exitCode = result.code ?? 1;
  } finally {
    await helper.close().catch(() => undefined);
    if (debugOutput) await rm(debugOutput, { force: true, recursive: true }).catch(() => undefined);
  }
}

module.exports = {
  AuthHelperError,
  buildMaestroEnvironment,
  createMagicAuthHelper,
  eventMatches,
  maestroArgs,
  normalizeRunId,
  requireStagingTarget,
  selectMagicAuthEvent,
  validateMagicAuthDetails,
  writeUserIdOutput,
};

if (require.main === module) {
  run().catch((error) => {
    console.error(`Maestro WorkOS auth runner failed: ${error?.code ?? "RUNNER_FAILED"}`);
    process.exitCode = 1;
  });
}
