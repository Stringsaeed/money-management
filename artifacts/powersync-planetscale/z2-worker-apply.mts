const base = process.env.Z2_WORKER_URL ?? "http://127.0.0.1:3001";
const origin = process.env.Z2_ORIGIN ?? "http://localhost:8081";

async function rpc<T>(
  path: string,
  body: unknown,
  cookie: string,
): Promise<{ status: number; json: T; raw: string }> {
  const res = await fetch(`${base}/rpc/${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
      origin,
    },
    body: JSON.stringify({ json: body }),
  });
  const raw = await res.text();
  let parsed: unknown = raw;
  try {
    parsed = JSON.parse(raw);
  } catch {
    /* keep raw */
  }
  const unwrapped =
    parsed && typeof parsed === "object" && "json" in parsed
      ? (parsed as { json: T }).json
      : (parsed as T);
  return { status: res.status, json: unwrapped, raw };
}

const email = `z2-worker-${Date.now()}@example.com`;
const password = "Z2-worker-pass-4242";
const signUp = await fetch(`${base}/api/auth/sign-up/email`, {
  method: "POST",
  headers: { "content-type": "application/json", origin },
  body: JSON.stringify({ email, password, name: "Z2 Worker" }),
});
const signUpText = await signUp.text();
const cookie = (signUp.headers.getSetCookie?.() ?? [])
  .map((c) => c.split(";", 1)[0])
  .filter(Boolean)
  .join("; ");
if (!cookie) {
  throw new Error(`signup missing cookie status=${signUp.status} body=${signUpText.slice(0, 400)}`);
}

const health = await rpc<unknown>("healthCheck", {}, cookie);
const household = await rpc<{ householdId?: string }>("households/create", { name: "Z2 Worker HH" }, cookie);
if (!household.json.householdId) {
  throw new Error(`household create failed ${household.status} ${household.raw}`);
}
const householdId = household.json.householdId;

const accountId = crypto.randomUUID();
const accountCmd = {
  commandId: crypto.randomUUID(),
  householdId,
  kind: "account.create",
  payload: {
    id: accountId,
    name: "Z2 Worker Checking",
    type: "bank",
    currency: "USD",
    initialBalanceMinor: 10_000,
  },
};
const account = await rpc<Record<string, unknown>>("commands/apply", accountCmd, cookie);

const categoryId = crypto.randomUUID();
const category = await rpc<Record<string, unknown>>(
  "commands/apply",
  {
    commandId: crypto.randomUUID(),
    householdId,
    kind: "category.create",
    payload: { id: categoryId, name: "Z2 Coffee", type: "expense" },
  },
  cookie,
);

const commandId = crypto.randomUUID();
const envelope = {
  commandId,
  householdId,
  kind: "transaction.create",
  payload: {
    type: "expense",
    amountMinor: 1300,
    date: "2026-09-07",
    accountId,
    categoryId,
    description: "Z2 worker apply",
  },
};
const first = await rpc<Record<string, unknown>>("commands/apply", envelope, cookie);
const replay = await rpc<Record<string, unknown>>("commands/apply", envelope, cookie);

const report = {
  base,
  email,
  healthStatus: health.status,
  health: health.json,
  householdId,
  accountKind: account.json.kind ?? account.json,
  firstStatus: first.status,
  first: first.json,
  replayStatus: replay.status,
  replay: replay.json,
  commandId,
};

console.log(JSON.stringify(report, null, 2));
if (first.json.kind !== "applied" || replay.json.replayed !== true) {
  throw new Error("worker apply did not apply+replay");
}
