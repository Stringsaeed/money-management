/*
 * The WorkOS API key never enters Maestro. The runner exposes this one-shot
 * loopback endpoint and only the returned code is kept in transient output.
 */
const helperUrl = globalThis.MAESTRO_WORKOS_HELPER_URL;
const helperNonce = globalThis.MAESTRO_WORKOS_HELPER_NONCE;
const email = globalThis.MAESTRO_WORKOS_TEST_EMAIL;
const clientId = globalThis.MAESTRO_WORKOS_CLIENT_ID;
const outputStore = globalThis.output;
const runStartedAtMs = outputStore?.authRunStartedAtMs;

if (!helperUrl || !helperNonce || !email || !clientId || !outputStore || !runStartedAtMs) {
  throw new Error("WorkOS auth helper is not configured.");
}

let response;
try {
  response = globalThis.http.post(helperUrl, {
    body: JSON.stringify({
      client_id: clientId,
      email: email,
      nonce: helperNonce,
      run_started_at_ms: runStartedAtMs,
    }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
} catch {
  throw new Error("WorkOS auth helper was unreachable.");
}

if (!response.ok || response.status !== 200) {
  throw new Error("WorkOS auth helper rejected the request.");
}

let payload;
try {
  payload = globalThis.json(response.body);
} catch {
  throw new Error("WorkOS auth helper returned an invalid response.");
}

if (
  !payload ||
  Object.prototype.toString.call(payload.code) !== "[object String]" ||
  !/^\d{6}$/.test(payload.code)
) {
  throw new Error("WorkOS auth helper returned an invalid code.");
}

outputStore.authMagicAuthCode = payload.code;
