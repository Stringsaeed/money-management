import { Hono, type Context } from "hono";
import { z } from "zod";

import { listAccounts, createAccount, deleteAccount, getAccount, updateAccount } from "./accounts";
import {
  listCategories,
  createCategory,
  deleteCategory,
  getCategory,
  updateCategory,
} from "./categories";
import { getHome } from "./home";
import {
  createRecurringRule,
  getRecurringRule,
  listRecurringRules,
  listUpcoming,
  settleRecurringRule,
  updateRecurringRule,
} from "./recurring";
import {
  getTransaction,
  listTransactions,
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "./transactions";
import {
  accountCreateSchema,
  accountUpdateSchema,
  categoryCreateSchema,
  categoryUpdateSchema,
  recurringCreateSchema,
  recurringUpdateSchema,
  transactionCreateSchema,
  transactionKindSchema,
  transactionUpdateSchema,
  v2ScopeSchema,
  type V2LedgerScope,
  type V2Principal,
} from "./contracts";
import {
  idempotencyKeyFromHeader,
  parseExpectedVersion,
  resolveV2LedgerContext,
  type AuthorizeV2Household,
  type V2Database,
  V2ApiError,
} from "./shared";

export interface V2LedgerRouteDependencies {
  readonly db: V2Database;
  readonly getPrincipal: (context: Context) => Promise<V2Principal>;
  readonly authorizeHousehold?: AuthorizeV2Household;
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
    return context.json(await getHome(ledger));
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
    const kindValue = context.req.query("kind");
    const kind = kindValue === undefined ? undefined : transactionKindSchema.parse(kindValue);
    const cursor = context.req.query("cursor");
    const [beforeDate, beforeId] = cursor?.split(":", 2) ?? [];
    return context.json(
      await listTransactions(ledger, {
        limit: parseOptionalInteger(context.req.query("limit"), "limit"),
        beforeDate,
        beforeId,
        accountId: context.req.query("accountId"),
        categoryId: context.req.query("categoryId"),
        kind,
        from: context.req.query("from"),
        to: context.req.query("to"),
      }),
    );
  });
  routes.post("/transactions", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    return context.json(
      await createTransaction(
        ledger,
        await readJson(context, transactionCreateSchema),
        idempotencyKeyFromHeader(context.req.header("Idempotency-Key")),
      ),
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

  routes.get("/recurring/upcoming", async (context) => {
    const ledger = await resolveContext(dependencies, context);
    return context.json({ items: await listUpcoming(ledger), nextCursor: null });
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
      ),
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
