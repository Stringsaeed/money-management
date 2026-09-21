import { Hono } from "hono";
import { beforeEach, describe, expect, it } from "vitest";

import { createTestDb } from "../../test-support/db";
import { v2GuestSession } from "@trove/db/schema/v2-identity";
import { createV2LedgerRoutes } from "../ledger-routes";
import type { V2Principal } from "../contracts";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;

describe("V2 REST ledger routes", () => {
  let db: TestDb;
  let principal: V2Principal;
  let app: Hono;

  beforeEach(async () => {
    db = await createTestDb({ householdLedgerMirror: false });
    principal = {
      kind: "guest",
      guestSessionId: "guest-route",
    };
    await db.insert(v2GuestSession).values({
      id: "guest-route",
      tokenHash: "guest-route-token",
      clientKeyHash: "guest-route-client",
      status: "active",
      expiresAt: new Date(Date.now() + 60_000),
    });
    app = new Hono();
    app.route(
      "/api/v2",
      createV2LedgerRoutes({
        db,
        getPrincipal: async () => principal,
      }),
    );
  });

  it("supports direct guest Account and Transaction CRUD over HTTP", async () => {
    const accountResponse = await app.request("http://test/api/v2/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": "account-1" },
      body: JSON.stringify({ id: "wallet", name: "Wallet", type: "cash", currency: "USD" }),
    });
    expect(accountResponse.status).toBe(201);
    // SAFETY: the endpoint returned the 201 Account resource contract above.
    expect(((await accountResponse.json()) as { readonly id: string }).id).toBe("wallet");

    const transactionResponse = await app.request("http://test/api/v2/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": "transaction-1" },
      body: JSON.stringify({
        id: "income",
        accountId: "wallet",
        kind: "income",
        amountMinor: 250,
        date: "2026-09-01",
      }),
    });
    expect(transactionResponse.status).toBe(201);

    const listResponse = await app.request("http://test/api/v2/accounts");
    expect(listResponse.status).toBe(200);
    expect(await listResponse.json()).toMatchObject({
      items: [{ id: "wallet", balanceMinor: 250 }],
    });
  });

  it("replays an idempotent create without duplicating rows", async () => {
    const init = {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": "same" },
      body: JSON.stringify({ id: "wallet", name: "Wallet", type: "cash", currency: "USD" }),
    } as const;
    const first = await app.request("http://test/api/v2/accounts", init);
    const retry = await app.request("http://test/api/v2/accounts", init);
    expect(first.status).toBe(201);
    expect(retry.status).toBe(201);
    // SAFETY: the endpoint returned the same 201 Account resource contract on replay.
    expect((await retry.json()) as { readonly id: string }).toMatchObject({ id: "wallet" });
    // SAFETY: /accounts always returns the documented page envelope.
    const list = (await (await app.request("http://test/api/v2/accounts")).json()) as {
      readonly items: readonly unknown[];
    };
    expect(list.items).toHaveLength(1);
  });
});
