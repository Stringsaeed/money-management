import { Hono, type Context } from "hono";
import type { Effect } from "effect";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { z } from "zod";

import { listAccounts, createAccount, deleteAccount, getAccount, updateAccount } from "./accounts";
import { autoCategorizeTransaction } from "./auto-categorize";
import { getBudget, listBudgets } from "./budget";
import { activateBudget, updateBudget } from "./budget-activate";
import { listBudgetActivity } from "./budget-activity";
import { createAssignments, getBudgetPeriod } from "./budget-assignments";
import { createEnvelope, payEnvelope, updateEnvelope } from "./budget-envelopes";
import type { BudgetFailure } from "./budget-errors";
import { runBudgetRoute, type BudgetServices } from "./budget-http";
import { getBudgetSetupFacts } from "./budget-setup-facts";
import type { TransactionCategorizer } from "./categorizer";
import {
  listCategories,
  createCategory,
  deleteCategory,
  getCategory,
  updateCategory,
} from "./categories";
import { getHome, getHomeOverviewBuckets } from "./home";
import {
  createRecurringRule,
  getRecurringRule,
  listRecurringRules,
  listUpcoming,
  settleRecurringRule,
  updateRecurringRule,
} from "./recurring";
import { listDue, payOccurrence, skipOccurrence } from "./recurring-reminders";
import {
  decodeTransactionCursor,
  getTransaction,
  listTransactions,
  summarizeTransactions,
  type TransactionFilterOptions,
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "./transactions";
import {
  accountCreateSchema,
  accountUpdateSchema,
  BUDGET_CURRENCY,
  budgetActivateSchema,
  budgetCurrencySchema,
  budgetUpdateSchema,
  assignmentsCreateSchema,
  categoryCreateSchema,
  envelopeCreateSchema,
  envelopePaySchema,
  envelopeUpdateSchema,
  ledgerDateSchema,
  categoryUpdateSchema,
  recurringCreateSchema,
  recurringPaySchema,
  recurringUpdateSchema,
  transactionCreateSchema,
  transactionKindSchema,
  transactionUpdateSchema,
  currencySchema,
  v2ScopeSchema,
  type V2LedgerScope,
  type V2PaydayRule,
  type V2Principal,
} from "./contracts";
import {
  idempotencyKeyFromHeader,
  parseExpectedVersion,
  resolveV2LedgerContext,
  type AuthorizeV2Household,
  type V2Database,
  type V2LedgerContext,
  V2ApiError,
} from "./shared";

export interface V2LedgerRouteDependencies {
  readonly db: V2Database;
  readonly getPrincipal: (context: Context) => Promise<V2Principal>;
  readonly authorizeHousehold?: AuthorizeV2Household;
  /** Absent when no AI Gateway key is configured; `autoCategorize` then leaves Transactions uncategorized. */
  readonly categorizer?: TransactionCategorizer;
  /** Clock seam for budget "today"; defaults to the system clock. */
  readonly now?: () => Date;
}

export function createV2LedgerRoutes(dependencies: V2LedgerRouteDependencies): Hono {
  const routes = new Hono();

  routes.use("*", async (context, next) => {
    try {
      await next();
    } catch (error) {
      // SAFETY: respondError structurally parses non-Error auth values before use.
      return respondError(context, error as CaughtError);
    }
  });

  routes.get("/home", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    const currencyValue = context.req.query("currency");
    const currency = currencyValue ? currencySchema.safeParse(currencyValue) : null;
    if (currency && !currency.success)
      throw new V2ApiError(
        400,
        "invalid_currency",
        "currency must be a three-letter uppercase ISO code.",
      );
    return context.json(
      await getHome(ledger, {
        currency: currency?.data,
        accountIds: parseRepeated(context, "accountId"),
        from: parseOptionalDate(context.req.query("from"), "from"),
        to: parseOptionalDate(context.req.query("to"), "to"),
        recentLimit: parseOptionalInteger(context.req.query("recentLimit"), "recentLimit"),
      }),
    );
  });

  routes.get("/home/overview", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    const range = z.enum(["week", "month", "year"]).safeParse(context.req.query("range"));
    const currency = currencySchema.safeParse(context.req.query("currency"));
    const from = parseOptionalDate(context.req.query("from"), "from");
    const to = parseOptionalDate(context.req.query("to"), "to");
    if (
      !range.success ||
      !currency.success ||
      !from ||
      !to ||
      from > to ||
      (from && to && differenceInCalendarDays(parseISO(to), parseISO(from)) > 366)
    )
      throw new V2ApiError(
        400,
        "invalid_overview",
        "Home overview requires a valid range, currency, and date interval.",
      );
    return context.json(
      await getHomeOverviewBuckets(ledger, {
        range: range.data,
        currency: currency.data,
        from,
        to,
        accountId: context.req.query("accountId") || undefined,
      }),
    );
  });

  routes.get("/accounts", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    return context.json({
      items: await listAccounts(ledger, {
        includeArchived: context.req.query("includeArchived") === "true",
      }),
      nextCursor: null,
    });
  });
  routes.post("/accounts", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    return context.json(
      await createAccount(
        ledger,
        await readJson(context, accountCreateSchema),
        idempotencyKeyFromHeader(context.req.header("Idempotency-Key")),
      ),
      201,
    );
  });
  routes.get("/accounts/:id", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    return context.json(await getAccount(ledger, context.req.param("id")));
  });
  routes.patch("/accounts/:id", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    return context.json(
      await updateAccount(
        ledger,
        context.req.param("id"),
        await readJson(context, accountUpdateSchema),
        parseExpectedVersion(context.req.header("If-Match")),
        idempotencyKeyFromHeader(context.req.header("Idempotency-Key")),
      ),
    );
  });
  routes.delete("/accounts/:id", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    return context.json(
      await deleteAccount(
        ledger,
        context.req.param("id"),
        parseExpectedVersion(context.req.header("If-Match")),
        idempotencyKeyFromHeader(context.req.header("Idempotency-Key")),
      ),
    );
  });

  routes.get("/categories", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    const kind = context.req.query("kind");
    if (kind !== undefined && kind !== "income" && kind !== "expense") {
      throw new V2ApiError(400, "invalid_category_kind", "kind must be income or expense.");
    }
    return context.json({
      items: await listCategories(ledger, {
        kind,
        includeArchived: context.req.query("includeArchived") === "true",
      }),
      nextCursor: null,
    });
  });
  routes.post("/categories", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    return context.json(
      await createCategory(
        ledger,
        await readJson(context, categoryCreateSchema),
        idempotencyKeyFromHeader(context.req.header("Idempotency-Key")),
      ),
      201,
    );
  });
  routes.get("/categories/:id", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    return context.json(await getCategory(ledger, context.req.param("id")));
  });
  routes.patch("/categories/:id", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    return context.json(
      await updateCategory(
        ledger,
        context.req.param("id"),
        await readJson(context, categoryUpdateSchema),
        parseExpectedVersion(context.req.header("If-Match")),
        idempotencyKeyFromHeader(context.req.header("Idempotency-Key")),
      ),
    );
  });
  routes.delete("/categories/:id", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    return context.json(
      await deleteCategory(
        ledger,
        context.req.param("id"),
        parseExpectedVersion(context.req.header("If-Match")),
        idempotencyKeyFromHeader(context.req.header("Idempotency-Key")),
      ),
    );
  });

  routes.get("/transactions", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    const cursor = context.req.query("cursor");
    return context.json(
      await listTransactions(ledger, {
        ...parseTransactionFilters(context),
        limit: parseOptionalInteger(context.req.query("limit"), "limit"),
        cursor: cursor ? decodeTransactionCursor(cursor) : undefined,
      }),
    );
  });
  routes.get("/transactions/summary", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    return context.json(await summarizeTransactions(ledger, parseTransactionFilters(context)));
  });
  routes.post("/transactions", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    const input = await readJson(context, transactionCreateSchema);
    const created = await createTransaction(
      ledger,
      input,
      idempotencyKeyFromHeader(context.req.header("Idempotency-Key")),
    );
    if (!input.autoCategorize) return context.json(created, 201);
    return context.json(
      await autoCategorizeTransaction(ledger, created, dependencies.categorizer),
      201,
    );
  });
  routes.get("/transactions/:id", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    return context.json(await getTransaction(ledger, context.req.param("id")));
  });
  routes.patch("/transactions/:id", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    return context.json(
      await updateTransaction(
        ledger,
        context.req.param("id"),
        await readJson(context, transactionUpdateSchema),
        parseExpectedVersion(context.req.header("If-Match")),
        idempotencyKeyFromHeader(context.req.header("Idempotency-Key")),
      ),
    );
  });
  routes.delete("/transactions/:id", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    return context.json(
      await deleteTransaction(
        ledger,
        context.req.param("id"),
        parseExpectedVersion(context.req.header("If-Match")),
        idempotencyKeyFromHeader(context.req.header("Idempotency-Key")),
      ),
    );
  });

  /**
   * Budget and bill-reminder routes run Effect programs through one boundary.
   * `?currency=XXX` selects the budget (#400); omitted means the only budget.
   */
  const runBudget = <A>(
    context: Context,
    ledger: V2LedgerContext,
    program: Effect.Effect<A, BudgetFailure, BudgetServices>,
  ) =>
    runBudgetRoute(
      ledger,
      dependencies.now?.() ?? new Date(),
      program,
      parseBudgetCurrency(context.req.query("currency")),
    );

  routes.get("/budgets", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    return context.json(await runBudget(context, ledger, listBudgets));
  });
  routes.get("/budget", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    return context.json(await runBudget(context, ledger, getBudget));
  });
  routes.get("/budget/setup-facts", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    const rule = parsePaydayQuery(context.req.query("payday"));
    const currency = parseBudgetCurrency(context.req.query("currency")) ?? BUDGET_CURRENCY;
    return context.json(await runBudget(context, ledger, getBudgetSetupFacts(rule, currency)));
  });
  routes.post("/budget/activate", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    const input = await readJson(context, budgetActivateSchema);
    const key = idempotencyKeyFromHeader(context.req.header("Idempotency-Key"));
    return context.json(await runBudget(context, ledger, activateBudget(input, key)), 201);
  });
  routes.patch("/budget", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    const input = await readJson(context, budgetUpdateSchema);
    const version = parseExpectedVersion(context.req.header("If-Match"));
    const key = idempotencyKeyFromHeader(context.req.header("Idempotency-Key"));
    return context.json(await runBudget(context, ledger, updateBudget(input, version, key)));
  });

  routes.post("/budget/envelopes", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    const input = await readJson(context, envelopeCreateSchema);
    const key = idempotencyKeyFromHeader(context.req.header("Idempotency-Key"));
    return context.json(await runBudget(context, ledger, createEnvelope(input, key)), 201);
  });
  routes.patch("/budget/envelopes/:id", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    const input = await readJson(context, envelopeUpdateSchema);
    const version = parseExpectedVersion(context.req.header("If-Match"));
    const key = idempotencyKeyFromHeader(context.req.header("Idempotency-Key"));
    return context.json(
      await runBudget(
        context,
        ledger,
        updateEnvelope(context.req.param("id"), input, version, key),
      ),
    );
  });
  routes.post("/budget/envelopes/:id/pay", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    const input = await readJson(context, envelopePaySchema);
    const key = idempotencyKeyFromHeader(context.req.header("Idempotency-Key"));
    return context.json(
      await runBudget(context, ledger, payEnvelope(context.req.param("id"), input, key)),
      201,
    );
  });
  routes.post("/budget/assignments", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    const input = await readJson(context, assignmentsCreateSchema);
    const key = idempotencyKeyFromHeader(context.req.header("Idempotency-Key"));
    return context.json(await runBudget(context, ledger, createAssignments(input, key)), 201);
  });
  routes.get("/budget/activity", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    const limit = parseOptionalInteger(context.req.query("limit"), "limit");
    return context.json(await runBudget(context, ledger, listBudgetActivity(limit)));
  });
  routes.get("/budget/periods/:start", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    const start = parseOptionalDate(context.req.param("start"), "start") ?? "";
    return context.json(await runBudget(context, ledger, getBudgetPeriod(start)));
  });

  routes.get("/recurring/upcoming", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    return context.json({ items: await listUpcoming(ledger), nextCursor: null });
  });
  routes.get("/recurring/due", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    const through = parseOptionalDate(context.req.query("through"), "through");
    if (!through)
      throw new V2ApiError(400, "invalid_through", "through must be a YYYY-MM-DD date.");
    return context.json(await runBudget(context, ledger, listDue(through)));
  });
  routes.get("/recurring", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    return context.json({
      items: await listRecurringRules(ledger, {
        includeArchived: context.req.query("includeArchived") === "true",
      }),
      nextCursor: null,
    });
  });
  routes.post("/recurring", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    return context.json(
      await createRecurringRule(
        ledger,
        await readJson(context, recurringCreateSchema),
        idempotencyKeyFromHeader(context.req.header("Idempotency-Key")),
      ),
      201,
    );
  });
  routes.get("/recurring/:id", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    return context.json(await getRecurringRule(ledger, context.req.param("id")));
  });
  routes.patch("/recurring/:id", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    return context.json(
      await updateRecurringRule(
        ledger,
        context.req.param("id"),
        await readJson(context, recurringUpdateSchema),
        parseExpectedVersion(context.req.header("If-Match")),
        idempotencyKeyFromHeader(context.req.header("Idempotency-Key")),
        dependencies.now?.() ?? new Date(),
      ),
    );
  });
  routes.post("/recurring/:id/occurrences/:date/pay", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    const date = parseOccurrenceDate(context.req.param("date"));
    const input = await readJson(context, recurringPaySchema);
    const key = idempotencyKeyFromHeader(context.req.header("Idempotency-Key"));
    return context.json(
      await runBudget(context, ledger, payOccurrence(context.req.param("id"), date, input, key)),
      201,
    );
  });
  routes.post("/recurring/:id/occurrences/:date/skip", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    const date = parseOccurrenceDate(context.req.param("date"));
    const key = idempotencyKeyFromHeader(context.req.header("Idempotency-Key"));
    return context.json(
      await runBudget(context, ledger, skipOccurrence(context.req.param("id"), date, key)),
      201,
    );
  });
  routes.post("/recurring/:id/settle", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    return context.json(await settleRecurringRule(ledger, context.req.param("id")));
  });

  return routes;
}

async function resolveContext(dependencies: V2LedgerRouteDependencies, context: Context) {
  const principal = await dependencies.getPrincipal(context);
  const scope = parseRequestScope(context);
  return resolveV2LedgerContext(dependencies.db, principal, scope, {
    authorizeHousehold: dependencies.authorizeHousehold,
    access: ["GET", "HEAD", "OPTIONS"].includes(context.req.method) ? "read" : "write",
  });
}

function parseRequestScope(context: Context): V2LedgerScope {
  const kind = context.req.query("scope") ?? "personal";
  if (kind === "personal") return { kind: "personal" };
  if (kind === "household") {
    const householdId = context.req.query("householdId");
    if (!householdId)
      throw new V2ApiError(
        400,
        "household_id_required",
        "householdId is required for household scope.",
      );
    return v2ScopeSchema.parse({ kind, householdId });
  }
  throw new V2ApiError(400, "invalid_scope", "scope must be personal or household.");
}

async function readJson<T>(context: Context, schema: z.ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await context.req.json();
  } catch {
    throw new V2ApiError(400, "invalid_json", "Request body must be valid JSON.");
  }
  return schema.parse(body);
}

const MAX_FILTER_VALUES = 50;
const MAX_SEARCH_LENGTH = 100;

/** Filters repeat as query params: `?accountId=a&accountId=b&kind=expense`. */
function parseTransactionFilters(context: Context): TransactionFilterOptions {
  const kinds = parseRepeated(context, "kind").map((value) => {
    const parsed = transactionKindSchema.safeParse(value);
    if (!parsed.success)
      throw new V2ApiError(400, "invalid_kind", "kind must be income, expense, or transfer.");
    return parsed.data;
  });
  const search = context.req.query("q")?.trim();
  if (search && search.length > MAX_SEARCH_LENGTH)
    throw new V2ApiError(400, "invalid_q", `q must be at most ${MAX_SEARCH_LENGTH} characters.`);
  return {
    recurring: parseRecurringFilter(context.req.query("recurring")),
    accountIds: parseRepeated(context, "accountId"),
    categoryIds: parseRepeated(context, "categoryId"),
    kinds,
    from: parseOptionalDate(context.req.query("from"), "from"),
    to: parseOptionalDate(context.req.query("to"), "to"),
    search: search || undefined,
  };
}

/** `?recurring=true` keeps only entries a Recurring Rule posted; `false` or absent keeps all. */
function parseRecurringFilter(value: string | undefined): boolean | undefined {
  if (value === undefined || value === "" || value === "false") return undefined;
  if (value === "true") return true;
  throw new V2ApiError(400, "invalid_recurring", "recurring must be true or false.");
}

function parseRepeated(context: Context, name: string): string[] {
  const values = [...new Set((context.req.queries(name) ?? []).filter(Boolean))];
  if (values.length > MAX_FILTER_VALUES)
    throw new V2ApiError(
      400,
      `invalid_${name}`,
      `${name} accepts at most ${MAX_FILTER_VALUES} values.`,
    );
  return values;
}

function parseOccurrenceDate(value: string): string {
  return parseOptionalDate(value, "date") ?? "";
}

function parseOptionalDate(value: string | undefined, name: string): string | undefined {
  if (!value) return undefined;
  if (!ledgerDateSchema.safeParse(value).success)
    throw new V2ApiError(400, `invalid_${name}`, `${name} must be a YYYY-MM-DD date.`);
  return value;
}

/** `?currency=USD` naming a budget; any well-formed ISO 4217 code. */
function parseBudgetCurrency(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (!budgetCurrencySchema.safeParse(value).success)
    throw new V2ApiError(400, "invalid_currency", "currency must be an ISO 4217 currency code.");
  return value;
}

/** `?payday=day:25` or `?payday=last_workday`. */
function parsePaydayQuery(value: string | undefined): V2PaydayRule {
  if (value === "last_workday") return { kind: "last_workday" };
  const match = /^day:(\d{1,2})$/.exec(value ?? "");
  const day = match ? Number(match[1]) : Number.NaN;
  if (!Number.isInteger(day) || day < 1 || day > 28)
    throw new V2ApiError(400, "invalid_payday", "payday must be day:1 to day:28 or last_workday.");
  return { kind: "day", day };
}

function parseOptionalInteger(value: string | undefined, name: string): number | undefined {
  if (!value) return undefined;
  if (!/^\d+$/.test(value))
    throw new V2ApiError(400, `invalid_${name}`, `${name} must be a non-negative integer.`);
  return Number(value);
}

type CaughtError =
  | Error
  | z.ZodError
  | { readonly status: number; readonly code: string; readonly message: string };

async function respondError(context: Context, error: CaughtError): Promise<Response> {
  if (error instanceof z.ZodError) {
    return context.json(
      {
        error: {
          code: "validation_error",
          message: "Request validation failed.",
          issues: error.issues,
        },
      },
      422,
    );
  }
  if (error instanceof V2ApiError) {
    return context.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      error.status,
    );
  }
  if (isHttpError(error)) {
    return context.json({ error: { code: error.code, message: error.message } }, error.status);
  }
  console.error("v2 ledger route failed", {
    name: error instanceof Error ? error.name : "UnknownError",
  });
  return context.json(
    { error: { code: "internal_error", message: "The request could not be completed." } },
    500,
  );
}

function isHttpError(value: CaughtError): value is {
  readonly status: 400 | 401 | 403 | 404 | 409 | 412 | 422 | 429 | 500 | 503;
  readonly code: string;
  readonly message: string;
} {
  const parsed = z
    .object({
      status: z
        .number()
        .refine((status) => [400, 401, 403, 404, 409, 412, 422, 429, 500, 503].includes(status)),
      code: z.string(),
      message: z.string(),
    })
    .safeParse(value);
  return parsed.success;
}
