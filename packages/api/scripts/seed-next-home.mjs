// Seeds one V2 ledger through the public HTTP API so the redesigned mobile-next Home screen
// looks like its design: two accounts, ~5 months of history, bills due soon, and an active
// budget with Safe to spend left before payday.
//
//   TROVE_API_URL=http://127.0.0.1:3012/api/v2 \
//   TROVE_AUTH="Guest <guest token>"   # or "Bearer <access token>"; omit to mint a guest
//   SEED_CURRENCY=AED SEED_REFERENCE_DATE=2026-10-11 \
//   pnpm --filter @trove/api seed:next:home
//
// The plan (dates, amounts, notes) is deterministic for a given SEED and SEED_REFERENCE_DATE;
// transaction ids are derived from SEED, SEED_REFERENCE_DATE, and the target ledger's Current
// account. To resume an interrupted run, repeat it with the same SEED, SEED_REFERENCE_DATE, and
// a token for the same ledger: accounts, categories, and recurring rules are matched by name,
// written transactions are recognized by id, and an existing budget is left alone. Without
// TROVE_AUTH a new guest ledger is minted, so keep the printed guest token to resume into it.
//
// SEED_RESET=1 first removes what an earlier run of this script wrote into the ledger (use the
// same SEED and SEED_REFERENCE_DATE as that run): its transactions by their deterministic ids
// (this and the previous plan version), its recurring rules (archived: the API has no delete),
// and, when the ledger has no budget, its accounts and categories. The API cannot delete a
// budget, so an existing budget is kept together with the accounts and categories it points at;
// the accounts' opening balances are then corrected to the new plan.
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  getDate,
  parseISO,
  setDate,
  startOfMonth,
  subMonths,
} from "date-fns";

const base = (process.env.TROVE_API_URL ?? "http://127.0.0.1:3012/api/v2").replace(/\/+$/, "");
const currency = process.env.SEED_CURRENCY ?? "AED";
const seed = Number(process.env.SEED ?? 20261011);
const referenceDate = process.env.SEED_REFERENCE_DATE ?? format(new Date(), "yyyy-MM-dd");
const timeZone = process.env.SEED_TIME_ZONE ?? "Asia/Dubai";
const scope = process.env.SEED_SCOPE_QUERY ?? "scope=personal";
const concurrency = Number(process.env.SEED_CONCURRENCY ?? 6);
const reset = process.env.SEED_RESET === "1";
const REQUEST_TIMEOUT_MS = 20_000;
/** Bumped when the plan changes, so new transaction ids never collide with an older plan's. */
const PLAN_VERSION = "home-v2";
const LEGACY_PLAN_VERSIONS = [null];
const IDS_PER_VERSION = 2_000;
// A reset deletes rows whose creates may be replayed by key, so a reset run uses fresh keys.
const keyPrefix = reset ? `seed-home-${seed}-reset-${Date.now()}` : `seed-home-${seed}`;

/** Net worth across both accounts after every seeded transaction (49,526.50). */
const NET_WORTH_MINOR = 4_952_650;
/** Roughly what the budget should show as Safe to spend on the reference date. */
const SAFE_TO_SPEND_TARGET_MINOR = 204_630;
/** Roughly where the Current account opening balance should land. */
const CURRENT_OPENING_TARGET_MINOR = 300_000;
const HISTORY_MONTHS = 5;
const PAYDAY = 25;

const CURRENT_ACCOUNT = "Current account";
const SAVINGS_ACCOUNT = "Savings";

const EVERYDAY = [
  {
    name: "Groceries",
    icon: "\u{1F6D2}",
    color: "#4a8f69",
    weight: 16,
    min: 45,
    max: 420,
    notes: ["Carrefour", "Spinneys", "Waitrose", "Lulu", "Union Coop"],
  },
  {
    name: "Dining",
    icon: "\u{1F37D}\u{FE0F}",
    color: "#d46a4c",
    weight: 10,
    min: 38,
    max: 320,
    notes: ["Tashas", "Operation Falafel", "Salt", "Sushi night", "Brunch"],
  },
  {
    name: "Coffee",
    icon: "\u2615",
    color: "#8a6a4c",
    weight: 16,
    min: 14,
    max: 38,
    notes: ["% Arabica", "Common Grounds", "Starbucks", "Flat white"],
  },
  {
    name: "Transport",
    icon: "\u{1F695}",
    color: "#3b7dd8",
    weight: 10,
    min: 12,
    max: 85,
    notes: ["Careem", "Uber", "Metro top-up", "Salik"],
  },
  {
    name: "Shopping",
    icon: "\u{1F6CD}\u{FE0F}",
    color: "#d9588f",
    weight: 6,
    min: 60,
    max: 650,
    notes: ["Amazon", "Noon", "IKEA", "Zara", "Decathlon"],
  },
  {
    name: "Fun",
    icon: "\u{1F39F}\u{FE0F}",
    color: "#a05cc4",
    weight: 5,
    min: 25,
    max: 260,
    notes: ["VOX Cinemas", "Concert", "Bowling", "Padel"],
  },
];
const BILL_CATEGORIES = [
  { name: "Car loan", icon: "\u{1F697}", color: "#6b7c85" },
  { name: "Internet", icon: "\u{1F4F6}", color: "#3b7dd8" },
  { name: "Electricity", icon: "\u{1F4A1}", color: "#d9a02b" },
];
/** One-off expenses outside the budget plan, so they never touch the everyday strip. */
const UNBUDGETED_CATEGORIES = [
  { name: "Health", icon: "\u{1FA7A}", color: "#2f8f8a" },
  { name: "Gifts", icon: "\u{1F381}", color: "#d9588f" },
];
const INCOME_CATEGORIES = [
  { name: "Salary", icon: "\u{1F4BC}", color: "#4a8f69" },
  { name: "Side income", icon: "\u{1FA99}", color: "#2f8f8a" },
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
// The current budget period's everyday spending has its own stream, so tuning it never
// reshuffles the older months.
const periodRandom = mulberry32(seed ^ 0x5eed);
const periodBetween = (min, max) => min + periodRandom() * (max - min);
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
const uuidFrom = (next) => {
  const hex = Array.from({ length: 32 }, () => Math.floor(next() * 16).toString(16));
  hex[12] = "4";
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const s = hex.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
};
const uuid = () => uuidFrom(idRandom);
/** The transaction id stream for one plan version; `null` is the first version's spelling. */
const idStream = (version, currentAccountId) =>
  mulberry32(
    hash(
      version
        ? `${version}:${seed}:${referenceDate}:${currentAccountId}`
        : `${seed}:${referenceDate}:${currentAccountId}`,
    ),
  );
const ymd = (date) => format(date, "yyyy-MM-dd");
const minor = (whole) => Math.round(whole * 100);
/** Whole units rounded to a quarter, as minor units. */
const quarterMinor = (whole) => minor(Math.round(whole * 4) / 4);
const money = (value) =>
  `${currency} ${(value / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

let auth = process.env.TROVE_AUTH;
let mintedGuestToken = null;

function headersFor(body, key, ifMatch) {
  const headers = new Headers({ Accept: "application/json" });
  if (ifMatch !== undefined) headers.set("If-Match", String(ifMatch));
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

function initFor({ method = "GET", body, key, ifMatch } = {}) {
  return {
    method,
    headers: headersFor(body, key, ifMatch),
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
      `${what}: 401 - the token expired. Re-run with a fresh TROVE_AUTH for the same ledger and the same SEED_REFERENCE_DATE=${referenceDate}; finished rows are skipped.`,
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
  mintedGuestToken = guest.session.token;
  auth = `Guest ${mintedGuestToken}`;
  console.log("Minted a new guest ledger. To resume into it, re-run with:");
  console.log(`  TROVE_AUTH="Guest ${mintedGuestToken}"`);
}

async function ensureCategories() {
  const existing = expectOk(await request("/categories"), "List categories").items;
  const byKey = new Map(existing.filter((c) => !c.archived).map((c) => [`${c.kind}:${c.name}`, c]));
  const wanted = [
    ...[...EVERYDAY, ...BILL_CATEGORIES, ...UNBUDGETED_CATEGORIES].map((category) => ({
      ...category,
      kind: "expense",
    })),
    ...INCOME_CATEGORIES.map((category) => ({ ...category, kind: "income" })),
  ];
  const ids = new Map();
  for (const [index, category] of wanted.entries()) {
    let row = byKey.get(`${category.kind}:${category.name}`);
    if (!row) {
      row = expectOk(
        await request("/categories", {
          method: "POST",
          key: `${keyPrefix}-category-${category.kind}-${category.name}`,
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

/** The first date on or after `from` whose day of month is `day` (1-28). */
function nextOnDay(from, day) {
  const candidate = setDate(from, day);
  return candidate < from ? addMonths(candidate, 1) : candidate;
}

const pushRow = (rows, kind, category, amountMinor, date, note, extra = {}) =>
  rows.push({
    kind,
    category,
    amountMinor,
    date: ymd(date),
    note,
    account: CURRENT_ACCOUNT,
    ...extra,
  });

/** The first day of the budget period holding `today`: the latest payday on or before it. */
const periodStartOf = (today) =>
  getDate(today) >= PAYDAY ? setDate(today, PAYDAY) : setDate(subMonths(today, 1), PAYDAY);

const EVERYDAY_PLANNED_MINOR = {
  Groceries: minor(2_400),
  Dining: minor(1_000),
  Coffee: minor(300),
  Transport: minor(600),
  Shopping: minor(800),
  Fun: minor(500),
};
const NOTES = Object.fromEntries(EVERYDAY.map((category) => [category.name, category.notes]));
const SPIKE_CATEGORIES = ["Groceries", "Dining", "Shopping", "Fun"];

/**
 * Splits days of the current budget period into rows, keeping every everyday envelope under 92%
 * of its plan; a part that would cross that falls back to Groceries, the roomiest envelope.
 */
function periodRowWriter(rows) {
  const spent = Object.fromEntries(Object.keys(EVERYDAY_PLANNED_MINOR).map((name) => [name, 0]));
  const notePick = (name) => NOTES[name][Math.floor(periodRandom() * NOTES[name].length)];
  return (category, amountMinor, date) => {
    if (amountMinor <= 0) return;
    const fits = spent[category] + amountMinor <= EVERYDAY_PLANNED_MINOR[category] * 0.92;
    const name = fits ? category : "Groceries";
    if (spent[name] + amountMinor > EVERYDAY_PLANNED_MINOR[name])
      throw new Error(`The period plan would overspend ${name}; retune planPeriod.`);
    spent[name] += amountMinor;
    pushRow(rows, "expense", name, amountMinor, date, notePick(name));
  };
}

/**
 * Which kind of day each offset of the period is: about five spikes in sixteen days, today, and
 * ordinary days. Safe to spend near AED 2,000 with 14 days left means the period so far ran a
 * little over the AED 186.67 allowance, so ordinary days sit just under it.
 */
function periodDayKinds(days) {
  const kinds = Array.from({ length: days }, () => "normal");
  const past = days - 1;
  const spikes = Math.max(1, Math.round((past * 5) / 16));
  for (let index = 0; index < spikes; index += 1)
    kinds[Math.round((past * (index + 0.5)) / spikes)] = "spike";
  kinds[past] = "today";
  return kinds;
}

/**
 * Everyday spending for each day of the current budget period through today, shaped for the
 * Home Safe-to-spend strip: the daily allowance is the everyday plan over 30 days (AED 186.67),
 * spike days go over it (320-400) and the others stay under it (135-178).
 */
function planPeriod() {
  const today = parseISO(referenceDate);
  const start = periodStartOf(today);
  const days = differenceInCalendarDays(today, start) + 1;
  const rows = [];
  const write = periodRowWriter(rows);
  let spikeIndex = 0;
  for (const [offset, kind] of periodDayKinds(days).entries()) {
    const date = addDays(start, offset);
    if (kind === "today") {
      write("Coffee", quarterMinor(periodBetween(18, 28)), date);
      write("Transport", quarterMinor(periodBetween(20, 35)), date);
    } else if (kind === "spike") {
      const total = quarterMinor(periodBetween(320, 400));
      const coffee = offset % 2 === 0 ? quarterMinor(periodBetween(16, 26)) : 0;
      write("Coffee", coffee, date);
      write(SPIKE_CATEGORIES[spikeIndex % SPIKE_CATEGORIES.length], total - coffee, date);
      spikeIndex += 1;
    } else {
      const total = quarterMinor(periodBetween(135, 178));
      const coffee = offset % 2 === 0 ? quarterMinor(periodBetween(14, 28)) : 0;
      const transport = quarterMinor(periodBetween(15, 45));
      write("Coffee", coffee, date);
      write("Transport", transport, date);
      write(offset % 3 === 1 ? "Dining" : "Groceries", total - coffee - transport, date);
    }
  }
  return rows;
}

/** Income, the savings transfer, and the bills for one month; returns what the bills cost. */
function planFixed(rows, month) {
  const { back, happened, todayDay, carLoanDay, duDay } = month;
  if (happened(PAYDAY)) {
    const bonus = back === 1;
    const amount = minor(bonus ? 13_200 : 12_000);
    const note = bonus ? "Payroll + bonus" : "Payroll";
    pushRow(rows, "income", "Salary", amount, setDate(month.start, PAYDAY), note);
  }
  if (back > 0) {
    // Sized later in `balance`, so the Current account stays near its usual level.
    pushRow(rows, "transfer", null, 0, setDate(month.start, PAYDAY + 1), "Monthly savings", {
      toAccount: SAVINGS_ACCOUNT,
    });
  } else {
    const date = setDate(month.start, Math.max(1, todayDay - 4));
    pushRow(rows, "income", "Side income", minor(815), date, "Freelance logo job");
  }
  let billsMinor = 0;
  if (happened(5)) {
    // The current period's bill stays inside its AED 450 envelope.
    const amount = quarterMinor(back === 0 ? between(380, 449) : between(380, 520));
    billsMinor += amount;
    pushRow(rows, "expense", "Electricity", amount, setDate(month.start, 5), "DEWA");
  }
  if (happened(carLoanDay)) {
    billsMinor += minor(1_850);
    const date = setDate(month.start, carLoanDay);
    pushRow(rows, "expense", "Car loan", minor(1_850), date, "Car loan - ENBD");
  }
  if (happened(duDay)) {
    billsMinor += minor(375);
    const date = setDate(month.start, duDay);
    pushRow(rows, "expense", "Internet", minor(375), date, "du Home Internet");
  }
  return billsMinor;
}

/** Random everyday spending before the current period that adds exactly `budgetMinor`. */
function planEveryday(rows, month, budgetMinor) {
  if (month.lastRandomDay < 1) return budgetMinor;
  const randomDay = () => setDate(month.start, 1 + Math.floor(random() * month.lastRandomDay));
  let leftMinor = budgetMinor;
  let misses = 0;
  while (leftMinor > 0 && misses < 6) {
    const category = weighted(EVERYDAY);
    const amount = quarterMinor(between(category.min, category.max));
    if (amount > leftMinor) {
      misses += 1;
      continue;
    }
    leftMinor -= amount;
    pushRow(rows, "expense", category.name, amount, randomDay(), pick(category.notes));
  }
  if (leftMinor > 0)
    pushRow(rows, "expense", "Groceries", leftMinor, randomDay(), pick(EVERYDAY[0].notes));
  return 0;
}

/**
 * When the whole current month sits inside the budget period, the month's spend target is met
 * with one-offs outside the plan (a dentist visit, a gift) instead of everyday spending, so the
 * Safe-to-spend strip keeps its shape.
 */
function planOneOffs(rows, month, leftMinor) {
  if (leftMinor < minor(100)) return;
  const health = Math.min(leftMinor, quarterMinor(between(950, 1_250)));
  pushRow(
    rows,
    "expense",
    "Health",
    health,
    setDate(month.start, Math.min(3, month.todayDay)),
    "Dental checkup",
  );
  if (leftMinor - health >= minor(50)) {
    const date = setDate(month.start, Math.max(1, month.todayDay - 3));
    pushRow(rows, "expense", "Gifts", leftMinor - health, date, "Birthday gift");
  }
}

const sumMinor = (rows) => rows.reduce((sum, row) => sum + row.amountMinor, 0);

/**
 * Everything dated on or before the reference date, by category and account name. Spending per
 * month is drawn to an exact target so the monthly chart lands in a believable band; the current
 * budget period's everyday spending comes from `planPeriod`.
 */
function planHistory() {
  const today = parseISO(referenceDate);
  const todayDay = getDate(today);
  const periodStart = periodStartOf(today);
  const periodRows = planPeriod();
  // The car loan is due today and du in a week, so history uses the same days of the month.
  const carLoanDay = Math.min(todayDay, 28);
  const duDay = Math.min(getDate(addDays(today, 7)), 28);
  const currentTargetMinor = minor(
    Math.round(Math.min(9_800, Math.max(600, (4_300 / 11) * todayDay))),
  );
  const rows = [...periodRows];
  for (let back = HISTORY_MONTHS; back >= 0; back -= 1) {
    const start = startOfMonth(subMonths(today, back));
    const lastRandom = Math.min(
      (back === 0 ? today : endOfMonth(start)).getTime(),
      addDays(periodStart, -1).getTime(),
    );
    const month = {
      back,
      start,
      todayDay,
      carLoanDay,
      duDay,
      lastRandomDay: lastRandom >= start.getTime() ? getDate(new Date(lastRandom)) : 0,
      // In the current month only days strictly before today have happened; today and later
      // belong to the recurring rules as upcoming occurrences.
      happened: (day) => back > 0 || day < todayDay,
    };
    const prefix = ymd(start).slice(0, 7);
    const periodMinor = sumMinor(periodRows.filter((row) => row.date.startsWith(prefix)));
    const billsMinor = planFixed(rows, month);
    const targetMinor = back === 0 ? currentTargetMinor : minor(Math.round(between(7_800, 10_000)));
    const leftMinor = planEveryday(rows, month, targetMinor - billsMinor - periodMinor);
    if (back === 0) planOneOffs(rows, month, leftMinor);
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

const BUDGET_ENVELOPES = [
  { name: "Car loan", group: "bills", category: "Car loan", plannedMinor: minor(1_850) },
  // Deliberately 75 short of the 375 bill, so Home can show a bill that needs a top-up.
  { name: "du", group: "bills", category: "Internet", plannedMinor: minor(300) },
  { name: "Electricity", group: "bills", category: "Electricity", plannedMinor: minor(450) },
  { name: "Groceries", group: "everyday", category: "Groceries", plannedMinor: minor(2_400) },
  { name: "Dining", group: "everyday", category: "Dining", plannedMinor: minor(1_000) },
  { name: "Coffee", group: "everyday", category: "Coffee", plannedMinor: minor(300) },
  { name: "Transport", group: "everyday", category: "Transport", plannedMinor: minor(600) },
  { name: "Shopping", group: "everyday", category: "Shopping", plannedMinor: minor(800) },
  { name: "Fun", group: "everyday", category: "Fun", plannedMinor: minor(500) },
  {
    name: "Emergency fund",
    group: "saving",
    newCategory: "Emergency fund",
    plannedMinor: minor(1_500),
  },
];

/**
 * Safe to spend is the everyday envelopes' Left plus Not planned yet, which is the funding cash
 * minus what bills and savings still hold. Activation refuses a plan that leaves Not planned yet
 * below zero, so Safe to spend can never be below the everyday Left: the Current account is sized
 * for SAFE_TO_SPEND_TARGET_MINOR, or for exactly the everyday Left when that is higher.
 */
function currentAccountTarget(rows) {
  const periodStart = ymd(periodStartOf(parseISO(referenceDate)));
  let heldMinor = 0;
  let everydayLeftMinor = 0;
  for (const envelope of BUDGET_ENVELOPES) {
    const spentMinor = rows
      .filter((row) => row.kind === "expense" && row.category === envelope.category)
      .filter((row) => row.date >= periodStart && row.date <= referenceDate)
      .reduce((sum, row) => sum + row.amountMinor, 0);
    if (envelope.group === "everyday") everydayLeftMinor += envelope.plannedMinor - spentMinor;
    else heldMinor += envelope.plannedMinor - spentMinor;
  }
  return Math.max(SAFE_TO_SPEND_TARGET_MINOR, everydayLeftMinor) + heldMinor;
}

/** Size the savings transfers and both opening balances so the totals land exactly. */
function balance(planned) {
  const currentTarget = currentAccountTarget(planned);
  const transfers = planned.filter((row) => row.kind === "transfer");
  const netWithoutTransfers = planned.reduce(
    (sum, row) =>
      sum +
      (row.kind === "income" ? row.amountMinor : row.kind === "expense" ? -row.amountMinor : 0),
    0,
  );
  // currentOpening + net - transferred = currentTarget, with the opening near its target.
  const wanted = netWithoutTransfers - currentTarget + CURRENT_OPENING_TARGET_MINOR;
  const each = Math.max(0, Math.round(wanted / transfers.length / 10_000) * 10_000);
  for (const row of transfers) row.amountMinor = each;
  const transferred = each * transfers.length;
  return {
    rows: planned.filter((row) => row.amountMinor > 0),
    currentOpening: currentTarget - netWithoutTransfers + transferred,
    savingsOpening: NET_WORTH_MINOR - currentTarget - transferred,
  };
}

async function ensureAccounts(openings) {
  const accounts = expectOk(await request("/accounts"), "List accounts").items;
  const result = new Map();
  for (const [name, type, openingBalanceMinor] of [
    [CURRENT_ACCOUNT, "checking", openings.currentOpening],
    [SAVINGS_ACCOUNT, "savings", openings.savingsOpening],
  ]) {
    let row = accounts.find((account) => account.name === name && !account.archived);
    if (row && reset && row.openingBalanceMinor !== openingBalanceMinor) {
      row = expectOk(
        await request(`/accounts/${row.id}`, {
          method: "PATCH",
          key: `${keyPrefix}-account-opening-${row.id}`,
          body: { openingBalanceMinor },
          ifMatch: row.version,
        }),
        `Correct ${name} opening balance`,
      );
      console.log(`  "${name}" opening balance corrected to ${money(openingBalanceMinor)}`);
    }
    if (row && row.openingBalanceMinor !== openingBalanceMinor) {
      console.warn(
        `  "${name}" already exists with opening ${money(row.openingBalanceMinor)} (this plan wants ${money(openingBalanceMinor)}); keeping it. Resume with the original SEED_REFERENCE_DATE.`,
      );
    }
    if (!row) {
      row = expectOk(
        await request("/accounts", {
          method: "POST",
          key: `${keyPrefix}-${referenceDate}-account-${type}`,
          body: { name, type, currency, openingBalanceMinor },
        }),
        `Create account ${name}`,
      );
    }
    result.set(name, row.id);
  }
  return result;
}

async function writeTransactions(rows, accountIds, categoryIds) {
  // A replayed idempotency key returns 201; an id written by an earlier run is a
  // transaction_exists 409. Any other conflict is a real failure.
  const bodies = rows.map((row) => ({
    id: uuid(),
    accountId: accountIds.get(row.account),
    kind: row.kind,
    categoryId: row.category ? categoryIds.get(row.category) : null,
    toAccountId: row.toAccount ? accountIds.get(row.toAccount) : null,
    amountMinor: row.amountMinor,
    date: row.date,
    note: row.note,
  }));
  let created = 0;
  let skipped = 0;
  let next = 0;
  const worker = async () => {
    while (next < bodies.length) {
      const body = bodies[next];
      next += 1;
      const result = await request("/transactions", {
        method: "POST",
        key: `${keyPrefix}-transaction-${body.id}`,
        body,
      });
      if (result.status === 409 && result.body?.error?.code === "transaction_exists") skipped += 1;
      else {
        expectOk(result, `Create transaction ${body.id}`);
        created += 1;
      }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  console.log(
    `  transactions: ${created} written or replayed by idempotency key, ${skipped} already present by id (${bodies.length} planned)`,
  );
}

async function ensureRecurring(accountIds, categoryIds) {
  const today = parseISO(referenceDate);
  const existing = expectOk(await request("/recurring"), "List recurring rules").items;
  const rules = [
    {
      name: "Car loan",
      kind: "expense",
      category: "Car loan",
      amount: 1_850,
      start: today,
      note: "Car loan - ENBD",
    },
    {
      name: "du",
      kind: "expense",
      category: "Internet",
      amount: 375,
      start: addDays(today, 7),
      note: "du Home Internet",
    },
    // Electricity on the 5th and payday on the 25th; history already holds any before today.
    {
      name: "Electricity",
      kind: "expense",
      category: "Electricity",
      amount: 450,
      start: nextOnDay(today, 5),
      note: "DEWA",
    },
    {
      name: "Salary",
      kind: "income",
      category: "Salary",
      amount: 12_000,
      start: nextOnDay(today, PAYDAY),
      note: "Payroll",
    },
  ];
  for (const rule of rules) {
    if (existing.some((row) => row.name === rule.name && row.lifecycle !== "archived")) {
      console.log(`  recurring "${rule.name}" already exists`);
      continue;
    }
    expectOk(
      await request("/recurring", {
        method: "POST",
        key: `${keyPrefix}-${referenceDate}-recurring-${rule.name}`,
        body: {
          name: rule.name,
          accountId: accountIds.get(CURRENT_ACCOUNT),
          categoryId: categoryIds.get(rule.category),
          kind: rule.kind,
          amountMinor: minor(rule.amount),
          currency,
          note: rule.note,
          frequency: "month",
          intervalCount: 1,
          startDate: ymd(rule.start),
          timeZone,
          // Remind rules wait for Mark paid, so the settler never backfills them.
          mode: "remind",
        },
      }),
      `Create recurring ${rule.name}`,
    );
    console.log(`  recurring "${rule.name}" from ${ymd(rule.start)}`);
  }
}

/** `GET /budget` answers `{budget:null}` without a currency, but 404 for a named one it lacks. */
async function readBudget() {
  const result = await request(`/budget?currency=${currency}`);
  if (result.status === 404 && result.body?.error?.code === "budget_not_found")
    return { budget: null };
  return expectOk(result, "Read budget");
}

async function ensureBudget(accountIds, categoryIds) {
  const view = await readBudget();
  if (view.budget) {
    console.log(`  budget already active since ${view.budget.activatedOn}; leaving it as is`);
    return;
  }
  const current = accountIds.get(CURRENT_ACCOUNT);
  expectOk(
    await request("/budget/activate", {
      method: "POST",
      key: `${keyPrefix}-${referenceDate}-budget-${currency}`,
      body: {
        currency,
        paydayRule: { kind: "day", day: PAYDAY },
        usualSalaryMinor: minor(12_000),
        fundingAccountIds: [current],
        defaultAccountId: current,
        envelopes: BUDGET_ENVELOPES.map((envelope) => ({
          name: envelope.name,
          group: envelope.group,
          plannedMinor: envelope.plannedMinor,
          // Exactly one of the two is sent; JSON drops the undefined one.
          categoryId: envelope.newCategory ? undefined : categoryIds.get(envelope.category),
          newCategory: envelope.newCategory ? { name: envelope.newCategory } : undefined,
        })),
      },
    }),
    "Activate budget",
  );
  console.log("  budget activated");
}

async function summarize() {
  const accounts = expectOk(await request("/accounts"), "List accounts").items;
  const total = accounts
    .filter((account) => !account.archived && account.currency === currency)
    .reduce((sum, account) => sum + account.balanceMinor, 0);
  const view = await readBudget();
  const upcoming = expectOk(await request("/recurring/upcoming"), "List upcoming").items;
  const rules = expectOk(await request("/recurring"), "List recurring rules").items;
  const ruleNames = new Map(rules.map((rule) => [rule.id, rule.name]));
  console.log("\nSummary");
  for (const account of accounts) console.log(`  ${account.name}: ${money(account.balanceMinor)}`);
  const onTarget = total === NET_WORTH_MINOR ? "on target" : `target ${money(NET_WORTH_MINOR)}`;
  console.log(`  Net worth: ${money(total)} (${total} minor, ${onTarget})`);
  if (view.budget) {
    const { current } = view;
    console.log(
      `  Safe to spend: ${money(current.safeToSpendMinor)}, ${money(current.perDayMinor)}/day, ${current.daysLeft} days left (period ${current.period.start} to ${current.period.end})`,
    );
  }
  console.log(`  Upcoming recurring occurrences: ${upcoming.length}`);
  for (const item of upcoming)
    console.log(
      `    ${item.scheduledDate} ${ruleNames.get(item.ruleId) ?? item.ruleId} ${money(item.amountMinor)}`,
    );
  if (mintedGuestToken) console.log(`  Guest token: ${mintedGuestToken}`);
}

const SEEDED_EXPENSE_NAMES = new Set(
  [...EVERYDAY, ...BILL_CATEGORIES, ...UNBUDGETED_CATEGORIES].map((category) => category.name),
);
const SEEDED_INCOME_NAMES = new Set(INCOME_CATEGORIES.map((category) => category.name));
const SEEDED_RULE_NAMES = new Set(["Car loan", "du", "Electricity", "Salary"]);

async function listAllTransactions() {
  const items = [];
  let cursor = null;
  do {
    const query = `/transactions?limit=200${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const page = expectOk(await request(query), "List transactions");
    items.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);
  return items;
}

/** Deletes this script's transactions, by the ids every plan version generates for this ledger. */
async function resetTransactions(currentAccountId) {
  const ids = new Set();
  for (const version of [PLAN_VERSION, ...LEGACY_PLAN_VERSIONS]) {
    const next = idStream(version, currentAccountId);
    for (let index = 0; index < IDS_PER_VERSION; index += 1) ids.add(uuidFrom(next));
  }
  const seeded = (await listAllTransactions()).filter((row) => ids.has(row.id));
  for (const row of seeded) {
    const result = await request(`/transactions/${row.id}`, {
      method: "DELETE",
      key: `${keyPrefix}-delete-transaction-${row.id}`,
      ifMatch: row.version,
    });
    if (result.status !== 404) expectOk(result, `Delete transaction ${row.id}`);
  }
  console.log(`  reset: deleted ${seeded.length} seeded transactions`);
}

/** The API cannot delete a recurring rule on its own, so seeded rules are archived. */
async function resetRecurring() {
  const rules = expectOk(await request("/recurring"), "List recurring rules").items;
  const seeded = rules.filter((rule) => SEEDED_RULE_NAMES.has(rule.name));
  for (const rule of seeded) {
    expectOk(
      await request(`/recurring/${rule.id}`, {
        method: "PATCH",
        key: `${keyPrefix}-archive-recurring-${rule.id}`,
        body: { lifecycle: "archived" },
        ifMatch: rule.revision,
      }),
      `Archive recurring ${rule.name}`,
    );
  }
  console.log(`  reset: archived ${seeded.length} seeded recurring rules`);
}

async function deleteSeededRows(path, rows, what) {
  for (const row of rows) {
    const result = await request(`${path}/${row.id}`, {
      method: "DELETE",
      key: `${keyPrefix}-delete-${what}-${row.id}`,
      ifMatch: row.version,
    });
    if (result.status !== 404) expectOk(result, `Delete ${what} ${row.name}`);
  }
  console.log(`  reset: deleted ${rows.length} seeded ${what} rows`);
}

/**
 * SEED_RESET=1: remove what earlier runs wrote, so the plan below lands on a clean ledger. A
 * budget cannot be deleted through the API; while one exists its funding account and envelope
 * categories stay, and `ensureAccounts` corrects the opening balances instead.
 */
async function resetLedger() {
  const accounts = expectOk(await request("/accounts"), "List accounts").items;
  const current = accounts.find((account) => account.name === CURRENT_ACCOUNT);
  if (current) await resetTransactions(current.id);
  await resetRecurring();
  const view = await readBudget();
  if (view.budget) {
    console.log(
      "  reset: the API has no budget delete; keeping the budget and the accounts and categories it uses",
    );
    return;
  }
  const seededAccounts = accounts.filter((account) =>
    [CURRENT_ACCOUNT, SAVINGS_ACCOUNT].includes(account.name),
  );
  await deleteSeededRows("/accounts", seededAccounts, "account");
  const categories = expectOk(await request("/categories"), "List categories").items;
  const seededCategories = categories.filter((category) =>
    (category.kind === "expense" ? SEEDED_EXPENSE_NAMES : SEEDED_INCOME_NAMES).has(category.name),
  );
  await deleteSeededRows("/categories", seededCategories, "category");
}

async function main() {
  assertSecureBase();
  console.log(`Seeding the Home design ledger at ${base}`);
  console.log(`  SEED=${seed} SEED_REFERENCE_DATE=${referenceDate} SEED_CURRENCY=${currency}`);
  await ensureGuest();
  if (reset) await resetLedger();
  const plan = balance(planHistory());
  const categoryIds = await ensureCategories();
  const accountIds = await ensureAccounts(plan);
  idRandom = idStream(PLAN_VERSION, accountIds.get(CURRENT_ACCOUNT));
  await writeTransactions(plan.rows, accountIds, categoryIds);
  await ensureRecurring(accountIds, categoryIds);
  await ensureBudget(accountIds, categoryIds);
  await summarize();
}

await main();
