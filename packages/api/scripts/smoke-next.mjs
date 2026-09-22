import assert from "node:assert/strict";
import { format } from "date-fns";

const base = "http://127.0.0.1:3012/api/v2";
const today = format(new Date(), "yyyy-MM-dd");

async function request(path, token, method = "GET", body, key = crypto.randomUUID(), version) {
  const headers = new Headers({ "Content-Type": "application/json", "Idempotency-Key": key });
  if (token) headers.set("Authorization", `Guest ${token}`);
  if (version !== undefined) headers.set("If-Match", String(version));
  const options = { method, headers };
  if (body !== undefined) options.body = JSON.stringify(body);
  const response = await fetch(`${base}${path}`, options);
  return { status: response.status, body: await response.json() };
}

const denied = await request("/accounts");
assert.equal(denied.status, 401);
const guest = await request("/auth/guest", null, "POST");
assert.equal(guest.status, 200);
const token = guest.body.session.token;
const key = crypto.randomUUID();
const input = {
  name: "Smoke checking",
  type: "checking",
  currency: "USD",
  openingBalanceMinor: 10_000,
};
const account = await request("/accounts", token, "POST", input, key);
assert.equal(account.status, 201, JSON.stringify(account.body));
const replay = await request("/accounts", token, "POST", input, key);
assert.equal(replay.body.id, account.body.id, "Account creation retry must reuse its result");
const category = await request("/categories", token, "POST", {
  name: "Smoke expenses",
  kind: "expense",
});
assert.equal(category.status, 201, JSON.stringify(category.body));
const transactionInput = {
  accountId: account.body.id,
  categoryId: category.body.id,
  kind: "expense",
  amountMinor: 1_000,
  date: today,
  note: "HTTP smoke",
};
const transaction = await request("/transactions", token, "POST", transactionInput);
assert.equal(transaction.status, 201, JSON.stringify(transaction.body));
const stale = await request(
  `/transactions/${transaction.body.id}`,
  token,
  "PATCH",
  { note: "Stale write" },
  crypto.randomUUID(),
  transaction.body.version + 1,
);
assert.equal(stale.status, 412, "A stale edit must not overwrite data");
const edited = await request(
  `/transactions/${transaction.body.id}`,
  token,
  "PATCH",
  { amountMinor: 1_500 },
  crypto.randomUUID(),
  transaction.body.version,
);
assert.equal(edited.status, 200, JSON.stringify(edited.body));
assert.equal(edited.body.amountMinor, 1_500);
const reloaded = await request(`/transactions/${transaction.body.id}`, token);
assert.equal(reloaded.body.amountMinor, 1_500, "An edit must survive reloading");
const restored = await request(
  `/transactions/${transaction.body.id}`,
  token,
  "PATCH",
  { amountMinor: 1_000 },
  crypto.randomUUID(),
  edited.body.version,
);
assert.equal(restored.status, 200);

const recurring = await request("/recurring", token, "POST", {
  name: "Smoke recurring",
  accountId: account.body.id,
  categoryId: category.body.id,
  kind: "expense",
  amountMinor: 2_500,
  currency: "USD",
  frequency: "month",
  intervalCount: 1,
  startDate: today,
  endCount: 1,
  timeZone: "UTC",
  note: "Recurring HTTP smoke",
});
assert.equal(recurring.status, 201, JSON.stringify(recurring.body));
const settlement = await request(`/recurring/${recurring.body.id}/settle`, token, "POST");
assert.equal(settlement.status, 200, JSON.stringify(settlement.body));
await request(`/recurring/${recurring.body.id}/settle`, token, "POST");
const home = await request("/home", token);
assert.equal(home.status, 200);
assert.equal(
  home.body.accounts[0].balanceMinor,
  6_500,
  "Settlement retries must not duplicate the expense",
);
assert.equal(home.body.totals[0].expenseMinor, 3_500);
const removed = await request(
  `/transactions/${transaction.body.id}`,
  token,
  "DELETE",
  {},
  crypto.randomUUID(),
  restored.body.version,
);
assert.equal(removed.status, 200);
const deleted = await request(`/transactions/${transaction.body.id}`, token);
assert.equal(deleted.status, 404);

const renamedCategory = await request(
  `/categories/${category.body.id}`,
  token,
  "PATCH",
  { name: "Smoke essentials" },
  crypto.randomUUID(),
  category.body.version,
);
assert.equal(renamedCategory.status, 200);
assert.equal(renamedCategory.body.name, "Smoke essentials");
const removedCategory = await request(
  `/categories/${category.body.id}`,
  token,
  "DELETE",
  {},
  crypto.randomUUID(),
  renamedCategory.body.version,
);
assert.equal(removedCategory.status, 200);
assert.equal((await request(`/categories/${category.body.id}`, token)).status, 404);
assert.equal((await request(`/recurring/${recurring.body.id}`, token)).status, 404);
assert.deepEqual((await request("/transactions", token)).body.items, []);
assert.equal((await request("/home", token)).body.accounts[0].balanceMinor, 10_000);

const savings = await request("/accounts", token, "POST", {
  name: "Smoke savings",
  type: "savings",
  currency: "USD",
  openingBalanceMinor: 5_000,
});
assert.equal(savings.status, 201);
for (const [accountId, toAccountId] of [
  [account.body.id, savings.body.id],
  [savings.body.id, account.body.id],
]) {
  const transfer = await request("/transactions", token, "POST", {
    accountId,
    toAccountId,
    kind: "transfer",
    amountMinor: 200,
    date: today,
  });
  assert.equal(transfer.status, 201);
}
const removedAccount = await request(
  `/accounts/${account.body.id}`,
  token,
  "DELETE",
  {},
  crypto.randomUUID(),
  account.body.version,
);
assert.equal(removedAccount.status, 200);
assert.equal((await request(`/accounts/${account.body.id}`, token)).status, 404);
assert.deepEqual((await request("/transactions", token)).body.items, []);
assert.equal((await request(`/accounts/${savings.body.id}`, token)).body.balanceMinor, 5_000);

const secondGuest = await request("/auth/guest", null, "POST");
const otherToken = secondGuest.body.session.token;
const isolated = await request("/accounts", otherToken);
assert.deepEqual(isolated.body.items, [], "Guest ledgers must be isolated");
const inaccessible = await request(`/accounts/${savings.body.id}`, otherToken);
assert.equal(inaccessible.status, 404);
const household = await request("/households", token);
assert.equal(household.status, 403);
await request("/auth/revoke", token, "POST");
const revoked = await request("/accounts", token);
assert.equal(revoked.status, 401);
await request("/auth/revoke", otherToken, "POST");
console.log(
  "V2 live HTTP smoke passed: auth, guest persistence, idempotent CRUD, category/account cascades, stale-edit rejection, recurring settlement, Home totals, isolation, household guard, revocation.",
);
