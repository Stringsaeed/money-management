const base = process.env.Z2_WORKER_URL ?? "http://127.0.0.1:3001";
const origin = process.env.Z2_ORIGIN ?? "http://localhost:8081";

async function rpc<T>(path: string, body: unknown, cookie: string) {
  const res = await fetch(`${base}/rpc/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie, origin },
    body: JSON.stringify({ json: body }),
  });
  const raw = await res.text();
  const parsed = JSON.parse(raw) as { json?: T } | T;
  const json = parsed && typeof parsed === "object" && "json" in parsed ? parsed.json : (parsed as T);
  return { status: res.status, json, raw };
}

const email = `z2-import-${Date.now()}@example.com`;
const signUp = await fetch(`${base}/api/auth/sign-up/email`, {
  method: "POST",
  headers: { "content-type": "application/json", origin },
  body: JSON.stringify({ email, password: "Z2-worker-pass-4242", name: "Z2 Import" }),
});
const cookie = (signUp.headers.getSetCookie?.() ?? [])
  .map((c) => c.split(";", 1)[0])
  .filter(Boolean)
  .join("; ");
if (!cookie) throw new Error(`signup failed ${signUp.status}`);

const household = await rpc<{ householdId: string }>("households/create", { name: "Z2 Import HH" }, cookie);
const householdId = household.json.householdId;
const rows = Array.from({ length: 6 }, (_, index) => ({
  id: `acct-bind-${index}`,
  name: `Bind ${index}`,
  type: "bank",
  currency: "USD",
  color: "#4A90D9",
  icon: "banknote.fill",
  initialBalanceMinor: 10_000,
  excludeFromTotal: false,
  sortOrder: index,
  lifecycle: "active",
  lifecycleChangedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}));
const binds = rows.length * 19;
const started = Date.now();
const result = await rpc<Record<string, unknown>>(
  "commands/apply",
  {
    commandId: crypto.randomUUID(),
    householdId,
    kind: "import_bundle",
    payload: { entityType: "account", chunkIndex: 0, chunkCount: 1, rows },
  },
  cookie,
);
const report = {
  base,
  householdId,
  binds,
  durationMs: Date.now() - started,
  kind: result.json.kind,
  result: result.json,
};
console.log(JSON.stringify(report, null, 2));
if (binds <= 100 || result.json.kind !== "applied") {
  throw new Error("import chunk did not apply above the old D1 bind cap");
}
