// Seeds one V2 Account with a realistic Transaction history through the public HTTP API,
// so list paging, filters, and summaries can be exercised against real volume.
//
//   TROVE_API_URL=https://auth.trove.ing/api/v2 \
//   TROVE_AUTH="Bearer <access token>"   # or "Guest <guest token>"; omit to mint a guest
//   SEED_COUNT=1000 SEED_CURRENCY=AED \
//   pnpm --filter @trove/api seed:next
//
// The run is deterministic (fixed PRNG seed and ids) and resumable: re-running skips rows
// the server already has (409), so an expired token mid-run only needs a fresh token.
import { format, subDays } from "date-fns";

const base = (process.env.TROVE_API_URL ?? "http://127.0.0.1:3012/api/v2").replace(/\/+$/, "");
const count = Number(process.env.SEED_COUNT ?? 1000);
const currency = process.env.SEED_CURRENCY ?? "AED";
const accountName = process.env.SEED_ACCOUNT_NAME ?? "Seed Everyday";
const seed = Number(process.env.SEED ?? 20260928);
const scope = process.env.SEED_SCOPE_QUERY ?? "scope=personal";
const concurrency = Number(process.env.SEED_CONCURRENCY ?? 6);

const EXPENSES = [
  {
    name: "Groceries",
    icon: "🛒",
    color: "#4a8f69",
    weight: 18,
    min: 40,
    max: 620,
    notes: ["Carrefour", "Spinneys", "Waitrose", "Lulu", "Union Coop", ""],
  },
  {
    name: "Dining",
    icon: "🍽️",
    color: "#d46a4c",
    weight: 14,
    min: 35,
    max: 480,
    notes: ["Tashas", "Operation Falafel", "Salt", "Sushi night", "Brunch", ""],
  },
  {
    name: "Coffee",
    icon: "☕",
    color: "#8a6a4c",
    weight: 16,
    min: 14,
    max: 42,
    notes: ["% Arabica", "Common Grounds", "Starbucks", "Flat white", ""],
  },
  {
    name: "Transport",
    icon: "🚌",
    color: "#3b7dd8",
    weight: 10,
    min: 8,
    max: 95,
    notes: ["Careem", "Uber", "Metro top-up", "Salik", ""],
  },
  {
    name: "Fuel",
    icon: "⛽",
    color: "#6b7c85",
    weight: 5,
    min: 80,
    max: 260,
    notes: ["ENOC", "ADNOC", ""],
  },
  {
    name: "Shopping",
    icon: "🛍️",
    color: "#d9588f",
    weight: 8,
    min: 60,
    max: 1_400,
    notes: ["Amazon", "Noon", "IKEA", "Zara", "Decathlon", ""],
  },
  {
    name: "Health",
    icon: "💊",
    color: "#2f8f8a",
    weight: 4,
    min: 30,
    max: 650,
    notes: ["Pharmacy", "Clinic visit", "Gym", ""],
  },
  {
    name: "Entertainment",
    icon: "🎬",
    color: "#a05cc4",
    weight: 5,
    min: 25,
    max: 380,
    notes: ["VOX Cinemas", "Netflix", "Concert", "Bowling", ""],
  },
  {
    name: "Travel",
    icon: "✈️",
    color: "#6a5acd",
    weight: 2,
    min: 400,
    max: 4_800,
    notes: ["Emirates", "flydubai", "Booking.com", "Airbnb"],
  },
];
const BILLS = [
  { name: "Rent", icon: "🏠", color: "#d9a02b", day: 1, amount: 7_500, note: "Monthly rent" },
  { name: "Utilities", icon: "💡", color: "#8a9a3b", day: 8, amount: 640, note: "DEWA" },
  { name: "Phone & Internet", icon: "📱", color: "#3b7dd8", day: 12, amount: 389, note: "du Home" },
];
const INCOME = [
  { name: "Salary", icon: "💼", color: "#4a8f69", day: 26, amount: 24_000, note: "Payroll" },
  { name: "Freelance", icon: "💻", color: "#2f8f8a" },
  { name: "Refunds", icon: "🎁", color: "#d9a02b" },
];

function mulberry32(value) {
  let state = value >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}
const random = mulberry32(seed);
const between = (min, max) => min + random() * (max - min);
const pick = (items) => items[Math.floor(random() * items.length)];
const weighted = (items) => {
  let roll = random() * items.reduce((sum, item) => sum + item.weight, 0);
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items.at(-1);
};
const uuid = () => {
  const hex = Array.from({ length: 32 }, () => Math.floor(random() * 16).toString(16));
  hex[12] = "4";
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const s = hex.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
};

let auth = process.env.TROVE_AUTH;

function headersFor(body, key) {
  const headers = new Headers({ Accept: "application/json" });
  if (auth) headers.set("Authorization", auth);
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (key) headers.set("Idempotency-Key", key);
  return headers;
}

const retryable = (status) => status === 429 || status >= 500;

async function request(path, { method = "GET", body, key } = {}) {
  const url = `${base}${path}${path.includes("?") ? "&" : "?"}${scope}`;
  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(url, {
      method,
      headers: headersFor(body, key),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    if (!retryable(response.status) || attempt >= 4)
      return { status: response.status, body: payload };
    await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
  }
}

function expectOk(result, what) {
  if (result.status === 401) {
    throw new Error(
      `${what}: 401 — the token expired. Re-run with a fresh TROVE_AUTH; finished rows are skipped.`,
    );
  }
  if (result.status >= 300)
    throw new Error(`${what}: ${result.status} ${JSON.stringify(result.body)}`);
  return result.body;
}

async function ensureGuest() {
  if (auth) return;
  const guest = expectOk(await request("/auth/guest", { method: "POST" }), "Create guest");
  auth = `Guest ${guest.session.token}`;
  console.log(`Minted guest session; token: ${guest.session.token}`);
}

async function ensureAccount() {
  const accounts = expectOk(await request("/accounts"), "List accounts").items;
  const existing = accounts.find((account) => account.name === accountName && !account.archived);
  if (existing) return existing;
  return expectOk(
    await request("/accounts", {
      method: "POST",
      key: `seed-${seed}-account`,
      body: { name: accountName, type: "checking", currency, openingBalanceMinor: 25_000_00 },
    }),
    "Create account",
  );
}

async function ensureCategories() {
  const existing = expectOk(await request("/categories"), "List categories").items;
  const byKey = new Map(existing.filter((c) => !c.archived).map((c) => [`${c.kind}:${c.name}`, c]));
  const wanted = [
    ...[...EXPENSES, ...BILLS].map((category) => ({ ...category, kind: "expense" })),
    ...INCOME.map((category) => ({ ...category, kind: "income" })),
  ];
  const ids = new Map();
  for (const category of wanted) {
    let row = byKey.get(`${category.kind}:${category.name}`);
    if (!row) {
      row = expectOk(
        await request("/categories", {
          method: "POST",
          key: `seed-${seed}-category-${category.kind}-${category.name}`,
          body: {
            name: category.name,
            kind: category.kind,
            icon: category.icon,
            color: category.color,
          },
        }),
        `Create category ${category.name}`,
      );
    }
    ids.set(category.name, row.id);
  }
  return ids;
}

function plan(categoryIds) {
  const today = new Date();
  const rows = [];
  const push = (kind, name, amount, date, note) =>
    rows.push({
      id: uuid(),
      kind,
      categoryId: categoryIds.get(name),
      amountMinor: Math.max(1, Math.round(amount * 100)),
      date: format(date, "yyyy-MM-dd"),
      note,
    });
  // Fixed monthly income and bills over the history window, then discretionary spend.
  const days = Math.ceil(count / 2.1);
  for (let offset = 0; offset < days; offset += 1) {
    const date = subDays(today, offset);
    const day = date.getDate();
    for (const bill of BILLS)
      if (day === bill.day) push("expense", bill.name, bill.amount, date, bill.note);
    if (day === INCOME[0].day) push("income", "Salary", INCOME[0].amount, date, INCOME[0].note);
  }
  while (rows.length < count) {
    const date = subDays(today, Math.floor(random() * days));
    const roll = random();
    if (roll < 0.03)
      push(
        "income",
        "Freelance",
        between(800, 6_500),
        date,
        pick(["Design retainer", "Consulting", "Workshop", ""]),
      );
    else if (roll < 0.06)
      push(
        "income",
        "Refunds",
        between(20, 400),
        date,
        pick(["Amazon refund", "Cashback", "Returned item"]),
      );
    else {
      const category = weighted(EXPENSES);
      push(
        "expense",
        category.name,
        between(category.min, category.max),
        date,
        pick(category.notes),
      );
    }
  }
  return rows.slice(0, count);
}

async function main() {
  console.log(`Seeding ${count} transactions into "${accountName}" at ${base}`);
  await ensureGuest();
  const account = await ensureAccount();
  const categoryIds = await ensureCategories();
  const rows = plan(categoryIds);
  // Replayed idempotency keys return 201 and conflicting ids 409; either way the row exists.
  let confirmed = 0;
  let next = 0;
  const worker = async () => {
    while (next < rows.length) {
      const row = rows[next];
      next += 1;
      const result = await request("/transactions", {
        method: "POST",
        key: `seed-${seed}-transaction-${row.id}`,
        body: { ...row, accountId: account.id },
      });
      if (result.status !== 409) expectOk(result, `Create transaction ${row.id}`);
      confirmed += 1;
      if (confirmed % 100 === 0) console.log(`  ${confirmed}/${rows.length}`);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  const summary = expectOk(
    await request(`/transactions/summary?accountId=${encodeURIComponent(account.id)}`),
    "Summarize account",
  );
  console.log(`Account ${account.id} now holds ${summary.count} transactions.`);
}

await main();
