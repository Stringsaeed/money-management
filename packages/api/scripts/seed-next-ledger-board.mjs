// Seeds one V2 ledger through the public HTTP API so the mobile-next Ledger tab reads like its
// design board ("ledger feature" page of the Trove canvas): TODAY, YESTERDAY and a recurring bill
// four days back at the top, an October-style IN 12,000.00 / OUT 4,286.00 month, and three
// months of quieter history to scroll into.
//
//   TROVE_API_URL=http://127.0.0.1:3012/api/v2 \
//   TROVE_AUTH="Guest <guest token>"   # or "Bearer <access token>"; omit to mint a guest
//   SEED_REFERENCE_DATE=2026-10-11 \
//   pnpm --filter @trove/api seed:next:ledger
//
// The month totals match the board exactly when the ledger starts empty and the reference date
// is the 11th or later (the board's fillers sit 5-10 days back, inside the same month). The plan
// is deterministic for a given SEED and SEED_REFERENCE_DATE; transaction ids are derived from
// SEED, SEED_REFERENCE_DATE and the target ledger's card account, so a re-run with the same
// values skips what is already written. Without TROVE_AUTH a new guest ledger is minted; keep
// the printed token to resume into it.
//
// Entries have no time of day in the API. The Ledger prints the time an entry was logged only
// when it was logged on its own date, so today's rows show the time this script ran.
import {
  addDays,
  addMonths,
  format,
  getDate,
  parseISO,
  setDate,
  subDays,
  subMonths,
} from "date-fns";

const base = (process.env.TROVE_API_URL ?? "http://127.0.0.1:3012/api/v2").replace(/\/+$/, "");
const currency = process.env.SEED_CURRENCY ?? "AED";
const seed = Number(process.env.SEED ?? 20261011);
const referenceDate = process.env.SEED_REFERENCE_DATE ?? format(new Date(), "yyyy-MM-dd");
const timeZone = process.env.SEED_TIME_ZONE ?? "Asia/Dubai";
const scope = process.env.SEED_SCOPE_QUERY ?? "scope=personal";
const concurrency = Number(process.env.SEED_CONCURRENCY ?? 6);
const HISTORY_MONTHS = Number(process.env.SEED_HISTORY_MONTHS ?? 3);
const REQUEST_TIMEOUT_MS = 20_000;
const PLAN_VERSION = "ledger-board-v3";

const CARD = "ENBD Card";
const CASH = "Cash";
const ACCOUNTS = [
  { name: CARD, type: "credit_card", opening: 30_000 },
  { name: CASH, type: "cash", opening: 1_500 },
];

const EXPENSE_CATEGORIES = [
  { name: "Groceries", icon: "\u{1F6D2}", color: "#4a8f69" },
  { name: "Coffee", icon: "☕", color: "#8a6a4c" },
  { name: "Transport", icon: "\u{1F695}", color: "#3b7dd8" },
  { name: "Dining", icon: "\u{1F37D}\u{FE0F}", color: "#d46a4c" },
  { name: "Bills", icon: "\u{1F4A1}", color: "#d9a02b" },
  { name: "Shopping", icon: "\u{1F6CD}\u{FE0F}", color: "#d9588f" },
  { name: "Health", icon: "\u{1F48A}", color: "#2f8f8a" },
  { name: "Housing", icon: "\u{1F3E0}", color: "#6b7c85" },
];
const INCOME_CATEGORIES = [{ name: "Income", icon: "\u{1F4BC}", color: "#4a8f69" }];

/** The board's rows, newest first, as days back from the reference date. */
const BOARD_ROWS = [
  { back: 0, kind: "expense", category: "Groceries", amount: 64.2, note: "Weekly groceries" },
  { back: 0, kind: "expense", category: "Coffee", amount: 18, note: "Flat white" },
  { back: 1, kind: "income", category: "Income", amount: 12_000, note: "Salary" },
  { back: 1, kind: "expense", category: "Transport", amount: 32.5, note: "Taxi home", cash: true },
  { back: 1, kind: "expense", category: "Dining", amount: 145, note: "Dinner with friends" },
];
/** The recurring bill four days back (WED 07.10 on the board), posted by marking it paid. */
const BOARD_BILL = { back: 4, category: "Bills", amount: 410, note: "Electricity bill" };
/** The rest of the board month's 4,286.00 out: 3,616.30 across the six days before the bill. */
const BOARD_FILLERS = [
  { back: 5, category: "Groceries", amount: 286.5, note: "Carrefour Market" },
  { back: 5, category: "Transport", amount: 41, note: "Careem" },
  { back: 6, category: "Shopping", amount: 1_249, note: "Noon order" },
  { back: 6, category: "Coffee", amount: 24, note: "% Arabica" },
  { back: 7, category: "Dining", amount: 312, note: "Brunch" },
  { back: 8, category: "Health", amount: 186.3, note: "Pharmacy" },
  { back: 8, category: "Groceries", amount: 418, note: "Spinneys" },
  { back: 9, category: "Bills", amount: 389, note: "du Home Internet" },
  { back: 9, category: "Transport", amount: 48, note: "Salik top-up", cash: true },
  { back: 10, category: "Shopping", amount: 662.5, note: "IKEA" },
];
const EVERYDAY = [
  {
    category: "Groceries",
    min: 45,
    max: 420,
    notes: ["Carrefour", "Spinneys", "Waitrose", "Lulu"],
  },
  { category: "Coffee", min: 14, max: 32, notes: ["Flat white", "% Arabica", "Common Grounds"] },
  { category: "Transport", min: 12, max: 85, notes: ["Careem", "Uber", "Taxi home", "Salik"] },
  { category: "Dining", min: 38, max: 320, notes: ["Brunch", "Sushi night", "Tashas", "Salt"] },
  { category: "Shopping", min: 60, max: 650, notes: ["Amazon", "Noon order", "IKEA", "Zara"] },
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
/** FNV-1a, to fold the target ledger into the id seed. */
function hash(text) {
  let value = 0x811c9dc5;
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 0x01000193);
  return value >>> 0;
}

// Amounts and dates come from `random`, so the plan is identical for every ledger. Ids come
// from `idRandom`, keyed by the target ledger, because transaction ids are globally unique.
const random = mulberry32(seed);
let idRandom = mulberry32(seed);
const between = (min, max) => min + random() * (max - min);
const pick = (items) => items[Math.floor(random() * items.length)];
const uuid = () => {
  const hex = Array.from({ length: 32 }, () => Math.floor(idRandom() * 16).toString(16));
  hex[12] = "4";
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const s = hex.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
};
const ymd = (date) => format(date, "yyyy-MM-dd");
const minor = (whole) => Math.round(whole * 100);
const money = (value) =>
  `${currency} ${(value / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

let auth = process.env.TROVE_AUTH;

function headersFor(body, key) {
  const headers = new Headers({ Accept: "application/json" });
  if (auth) headers.set("Authorization", auth);
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (key) headers.set("Idempotency-Key", key);
  return headers;
}

const retryable = (status) => status === 429 || status >= 500;
const TIMED_OUT = 0;

/** Credentials only travel over HTTPS, except to this machine during local development. */
function assertSecureBase() {
  const url = new URL(base);
  const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !loopback) {
    throw new Error(
      `Refusing to send credentials to ${url.origin} over ${url.protocol}; use https.`,
    );
  }
}

async function send(url, init) {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "TypeError") return null;
    throw error;
  }
}

function initFor({ method = "GET", body, key } = {}) {
  return {
    method,
    headers: headersFor(body, key),
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

const settled = (status, attempt) => !(status === TIMED_OUT || retryable(status)) || attempt >= 4;

async function request(path, options) {
  const url = `${base}${path}${path.includes("?") ? "&" : "?"}${scope}`;
  for (let attempt = 0; ; attempt += 1) {
    const response = await send(url, initFor(options));
    const status = response?.status ?? TIMED_OUT;
    const payload = response ? await response.json().catch(() => null) : null;
    if (settled(status, attempt)) return { status, body: payload };
    await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
  }
}

function expectOk(result, what) {
  if (result.status === 401) {
    throw new Error(
      `${what}: 401 - the token expired. Re-run with a fresh TROVE_AUTH for the same ledger and SEED_REFERENCE_DATE=${referenceDate}; finished rows are skipped.`,
    );
  }
  if (result.status === TIMED_OUT) throw new Error(`${what}: no response after retries.`);
  if (result.status >= 300)
    throw new Error(`${what}: ${result.status} ${JSON.stringify(result.body)}`);
  return result.body;
}

async function ensureGuest() {
  if (auth) return;
  const guest = expectOk(await request("/auth/guest", { method: "POST" }), "Create guest");
  auth = `Guest ${guest.session.token}`;
  console.log("Minted a new guest ledger. To resume into it, re-run with:");
  console.log(`  TROVE_AUTH="Guest ${guest.session.token}"`);
}

async function ensureAccounts() {
  const existing = expectOk(await request("/accounts"), "List accounts").items;
  const ids = new Map();
  for (const account of ACCOUNTS) {
    let row = existing.find((item) => item.name === account.name && !item.archived);
    if (!row) {
      row = expectOk(
        await request("/accounts", {
          method: "POST",
          key: `seed-board-${seed}-account-${account.name}`,
          body: {
            name: account.name,
            type: account.type,
            currency,
            openingBalanceMinor: minor(account.opening),
          },
        }),
        `Create account ${account.name}`,
      );
    }
    ids.set(account.name, row.id);
  }
  return ids;
}

async function ensureCategories() {
  const existing = expectOk(await request("/categories"), "List categories").items;
  const byKey = new Map(existing.filter((c) => !c.archived).map((c) => [`${c.kind}:${c.name}`, c]));
  const wanted = [
    ...EXPENSE_CATEGORIES.map((category) => ({ ...category, kind: "expense" })),
    ...INCOME_CATEGORIES.map((category) => ({ ...category, kind: "income" })),
  ];
  const ids = new Map();
  for (const [index, category] of wanted.entries()) {
    let row = byKey.get(`${category.kind}:${category.name}`);
    if (!row) {
      row = expectOk(
        await request("/categories", {
          method: "POST",
          key: `seed-board-${seed}-category-${category.kind}-${category.name}`,
          body: {
            name: category.name,
            kind: category.kind,
            icon: category.icon,
            color: category.color,
            sortOrder: index,
          },
        }),
        `Create category ${category.name}`,
      );
    }
    ids.set(category.name, row.id);
  }
  return ids;
}

/** One or two everyday entries a day, plus salary, rent and both bills, for each past month. */
function planHistory(today) {
  const rows = [];
  // Late-month days do not exist in every month; the 28th always does.
  const salaryDay = Math.min(getDate(subDays(today, 1)), 28);
  for (let monthsBack = HISTORY_MONTHS; monthsBack >= 1; monthsBack -= 1) {
    const start = setDate(subMonths(today, monthsBack), 1);
    const end = subDays(addMonths(start, 1), 1);
    const on = (day) => setDate(start, day);
    rows.push(
      { date: start, kind: "expense", category: "Housing", amount: 4_500, note: "Monthly rent" },
      { date: on(2), kind: "expense", category: "Bills", amount: 389, note: "du Home Internet" },
      { date: on(7), kind: "expense", category: "Bills", amount: 395, note: "Electricity bill" },
      { date: on(salaryDay), kind: "income", category: "Income", amount: 12_000, note: "Salary" },
    );
    for (let day = start; day <= end; day = addDays(day, 1)) {
      const count = 1 + Math.floor(random() * 2);
      for (let index = 0; index < count; index += 1) {
        const spend = pick(EVERYDAY);
        rows.push({
          date: day,
          kind: "expense",
          category: spend.category,
          amount: Math.round(between(spend.min, spend.max) * 4) / 4,
          note: pick(spend.notes),
          cash: spend.category === "Transport" && random() < 0.4,
        });
      }
    }
  }
  return rows;
}

const toRow = (row, id = uuid()) => ({
  id,
  kind: row.kind,
  category: row.category,
  account: row.cash ? CASH : CARD,
  amountMinor: minor(row.amount),
  date: ymd(row.date),
  note: row.note,
});

/**
 * The Ledger lists a day's entries by id, highest first. Board rows take a descending rank in
 * their first eight hex digits so each day prints in the board's order.
 */
const rankedUuid = (rank) => `${(0xf0000000 - rank).toString(16)}${uuid().slice(8)}`;

/** History, then the board's own month in board order. */
function plan() {
  const today = parseISO(referenceDate);
  const board = [...BOARD_ROWS, ...BOARD_FILLERS.map((row) => ({ ...row, kind: "expense" }))].map(
    (row, rank) => toRow({ ...row, date: subDays(today, row.back) }, rankedUuid(rank)),
  );
  return [...planHistory(today).map((row) => toRow(row)), ...board];
}

async function writeTransactions(rows, accountIds, categoryIds) {
  let next = 0;
  let written = 0;
  const worker = async () => {
    while (next < rows.length) {
      const row = rows[next];
      next += 1;
      const result = await request("/transactions", {
        method: "POST",
        key: `seed-board-${seed}-transaction-${row.id}`,
        body: {
          id: row.id,
          kind: row.kind,
          accountId: accountIds.get(row.account),
          categoryId: categoryIds.get(row.category),
          amountMinor: row.amountMinor,
          date: row.date,
          note: row.note,
        },
      });
      // A replayed key returns 201; an id an earlier run wrote is a transaction_exists 409.
      const exists = result.status === 409 && result.body?.error?.code === "transaction_exists";
      if (!exists) expectOk(result, `Create transaction ${row.note} on ${row.date}`);
      written += 1;
      if (written % 100 === 0) console.log(`  ${written}/${rows.length}`);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
}

/** A monthly remind rule from the bill's date, paid for that date so its entry is Recurring. */
async function ensureRecurringBill(accountIds, categoryIds) {
  const date = ymd(subDays(parseISO(referenceDate), BOARD_BILL.back));
  const rules = expectOk(await request("/recurring"), "List recurring rules").items;
  let rule = rules.find((item) => item.name === BOARD_BILL.note && item.lifecycle !== "archived");
  if (!rule) {
    rule = expectOk(
      await request("/recurring", {
        method: "POST",
        key: `seed-board-${seed}-${referenceDate}-recurring`,
        body: {
          name: BOARD_BILL.note,
          accountId: accountIds.get(CARD),
          categoryId: categoryIds.get(BOARD_BILL.category),
          kind: "expense",
          amountMinor: minor(BOARD_BILL.amount),
          currency,
          note: BOARD_BILL.note,
          frequency: "month",
          intervalCount: 1,
          startDate: date,
          timeZone,
          // Remind rules wait for Mark paid, so the settler never backfills them.
          mode: "remind",
        },
      }),
      "Create recurring bill",
    );
  }
  const paid = await request(`/recurring/${encodeURIComponent(rule.id)}/occurrences/${date}/pay`, {
    method: "POST",
    key: `seed-board-${seed}-${referenceDate}-pay`,
    body: {},
  });
  // A second run finds the occurrence already settled.
  if (paid.status !== 409) expectOk(paid, "Mark the bill paid");
}

async function summarize() {
  const today = parseISO(referenceDate);
  const from = ymd(setDate(today, 1));
  const to = ymd(subDays(addMonths(setDate(today, 1), 1), 1));
  const month = expectOk(
    await request(`/transactions/summary?from=${from}&to=${to}`),
    "Summarize the month",
  );
  const all = expectOk(await request("/transactions/summary"), "Summarize the ledger");
  const totals = month.totals.find((total) => total.currency === currency);
  console.log(`Ledger now holds ${all.count} transactions.`);
  if (totals) {
    console.log(
      `  ${format(today, "MMM").toUpperCase()}: in ${money(totals.incomeMinor)}, out ${money(totals.expenseMinor)} (board: in ${currency} 12,000.00, out ${currency} 4,286.00)`,
    );
  }
}

async function main() {
  assertSecureBase();
  console.log(`Seeding the Ledger board at ${base}`);
  console.log(`  SEED=${seed} SEED_REFERENCE_DATE=${referenceDate}`);
  await ensureGuest();
  const accountIds = await ensureAccounts();
  idRandom = mulberry32(hash(`${PLAN_VERSION}:${seed}:${referenceDate}:${accountIds.get(CARD)}`));
  const categoryIds = await ensureCategories();
  await writeTransactions(plan(), accountIds, categoryIds);
  await ensureRecurringBill(accountIds, categoryIds);
  await summarize();
}

await main();
