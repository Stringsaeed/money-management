import type { V2Account, V2BudgetSetupFacts } from "@trove/api/v2/contracts";

import { emptySetupDraft, parseSetupDraft, serializeSetupDraft } from "../setup-draft";
import type { SetupItem } from "../setup-items";
import {
  buildActivateInput,
  fundingChoice,
  groupCounts,
  previewPlan,
  type FundingChoice,
} from "../setup-plan";

const aed = (dirhams: number) => dirhams * 100;

const facts = (overrides: Partial<V2BudgetSetupFacts> = {}): V2BudgetSetupFacts => ({
  today: "2026-10-12",
  period: { start: "2026-10-01", end: "2026-10-31" },
  accountBalances: [{ accountId: "current", balanceMinor: aed(5000) }],
  spendSincePeriodStart: [],
  cardPaymentsSincePeriodStart: [],
  openingCardDebtMinor: 0,
  lastPeriod: { start: "2026-09-01", end: "2026-09-30" },
  lastPeriodSpend: [],
  recurringExpenses: [],
  topCategories: [],
  ...overrides,
});

const item = (key: string, group: SetupItem["group"], categoryId: string | null): SetupItem => ({
  key,
  name: key,
  group,
  categoryId,
  defaultTicked: true,
  recurringMinor: null,
  lastPeriodMinor: null,
});

const groceries = item("cat:groceries", "everyday", "groceries");
const rent = item("new:rent", "saving", null);

const accountsFunding: FundingChoice = {
  accountIds: ["current"],
  openingCashMinor: null,
  invalid: false,
};

const preview = (
  overrides: Partial<Parameters<typeof previewPlan>[0]> & { amounts: Record<string, string> },
) =>
  previewPlan({
    currency: "AED",
    facts: facts(),
    payday: { kind: "day", day: 1 },
    items: [groceries, rent],
    funding: accountsFunding,
    ...overrides,
  });

describe("Left to plan", () => {
  it("is the money you have minus what you plan", () => {
    const result = preview({ amounts: { "cat:groceries": "1500", "new:rent": "2000.50" } });

    expect(result.leftToPlanMinor).toBe(aed(5000) - aed(1500) - 200050);
    expect(result.groupTotals).toEqual({ bills: 0, everyday: aed(1500), saving: 200050 });
  });

  it("counts spending already logged in a mapped Category once", () => {
    const result = preview({
      facts: facts({
        spendSincePeriodStart: [
          { categoryId: "groceries", accountId: "current", amountMinor: aed(400), onCard: false },
        ],
      }),
      amounts: { "cat:groceries": "1000" },
    });

    // 1000 planned, 400 already spent: 600 left in the envelope, so 4400 is not planned yet.
    expect(result.leftToPlanMinor).toBe(aed(5000) - aed(600));
    expect(result.safeToSpendMinor).toBe(aed(600) + (aed(5000) - aed(600)));
  });

  it("ignores spending in an unmapped Category or from an unticked account", () => {
    const result = preview({
      facts: facts({
        spendSincePeriodStart: [
          { categoryId: "fuel", accountId: "current", amountMinor: aed(300), onCard: false },
          { categoryId: "groceries", accountId: "savings", amountMinor: aed(300), onCard: false },
        ],
      }),
      amounts: { "cat:groceries": "1000" },
    });

    expect(result.leftToPlanMinor).toBe(aed(4000));
  });

  it("reserves unpaid credit card spending until a card payment covers it", () => {
    const card = {
      facts: facts({
        spendSincePeriodStart: [
          { categoryId: "groceries", accountId: "card", amountMinor: aed(200), onCard: true },
        ],
      }),
      amounts: { "cat:groceries": "300" },
    };

    expect(preview(card).leftToPlanMinor).toBe(aed(5000) - aed(100) - aed(200));
    expect(
      preview({
        ...card,
        facts: facts({
          ...card.facts,
          cardPaymentsSincePeriodStart: [
            { fromAccountId: "current", toAccountId: "card", amountMinor: aed(200) },
          ],
        }),
      }).leftToPlanMinor,
    ).toBe(aed(5000) - aed(100));
  });

  it("matches activation: an archived card and unmapped card spending reserve cash, old debt is paid first", () => {
    const spending: V2BudgetSetupFacts["spendSincePeriodStart"] = [
      // Archived card, mapped Category: lowers Groceries and reserves.
      { categoryId: "groceries", accountId: "old-card", amountMinor: aed(150), onCard: true },
      // Unmapped Categories on a card: reserve only.
      { categoryId: "fuel", accountId: "card", amountMinor: aed(80), onCard: true },
      { categoryId: null, accountId: "card", amountMinor: aed(20), onCard: true },
      // Already inside the balance, or from an account that is not ticked: never counted twice.
      { categoryId: "fuel", accountId: "current", amountMinor: aed(70), onCard: false },
      { categoryId: "groceries", accountId: "savings", amountMinor: aed(999), onCard: false },
    ];
    const amounts = { "cat:groceries": "1000" };

    // Cash 5000. Groceries: 1000 planned - 150 spent = 850 left. Card reserve 150 + 80 + 20 = 250.
    expect(
      preview({ facts: facts({ spendSincePeriodStart: spending }), amounts }).leftToPlanMinor,
    ).toBe(aed(5000) - aed(850) - aed(250));

    // The card owed 100 before the period; paying 200 from Current settles it and leaves 100 of
    // the payment against new spending, so the reserve is 150. A payment from savings is ignored.
    const paid = facts({
      spendSincePeriodStart: spending,
      openingCardDebtMinor: aed(100),
      cardPaymentsSincePeriodStart: [
        { fromAccountId: "current", toAccountId: "card", amountMinor: aed(200) },
        { fromAccountId: "savings", toAccountId: "card", amountMinor: aed(500) },
      ],
    });
    expect(preview({ facts: paid, amounts }).leftToPlanMinor).toBe(aed(5000) - aed(850) - aed(150));
  });

  it("starts from the typed total when there are no accounts", () => {
    const result = preview({
      funding: { accountIds: [], openingCashMinor: aed(800), invalid: false },
      amounts: { "cat:groceries": "300" },
    });

    expect(result.leftToPlanMinor).toBe(aed(500));
  });

  it("goes negative when the plan is more than you have", () => {
    const result = preview({ amounts: { "cat:groceries": "4000", "new:rent": "1500" } });

    expect(result.leftToPlanMinor).toBe(-aed(500));
  });

  it("treats an empty amount as zero", () => {
    expect(preview({ amounts: {} }).leftToPlanMinor).toBe(aed(5000));
  });
});

describe("activation request", () => {
  const draft = {
    ...emptySetupDraft(),
    usualSalary: "12000",
    paydayReminder: false,
    amounts: { "cat:groceries": "1500", "new:rent": "2000.50" },
  };

  it("maps funding accounts, envelopes, and amounts", () => {
    const input = buildActivateInput(
      draft,
      { kind: "last_workday" },
      accountsFunding,
      [groceries, rent],
      "AED",
    );

    expect(input).toEqual({
      currency: "AED",
      paydayRule: { kind: "last_workday" },
      usualSalaryMinor: aed(12000),
      paydayReminder: false,
      fundingAccountIds: ["current"],
      envelopes: [
        {
          name: "cat:groceries",
          group: "everyday",
          categoryId: "groceries",
          plannedMinor: aed(1500),
        },
        {
          name: "new:rent",
          group: "saving",
          newCategory: { name: "new:rent" },
          plannedMinor: 200050,
        },
      ],
    });
  });

  it("sends the typed total instead of accounts and leaves out an empty salary", () => {
    const input = buildActivateInput(
      { ...draft, usualSalary: "" },
      { kind: "day", day: 25 },
      { accountIds: [], openingCashMinor: aed(800), invalid: false },
      [groceries],
      "USD",
    );

    expect(input.currency).toBe("USD");

    expect(input.openingCashMinor).toBe(aed(800));
    expect(input).not.toHaveProperty("fundingAccountIds");
    expect(input).not.toHaveProperty("usualSalaryMinor");
  });
});

describe("funding choice", () => {
  const account = (id: string, overrides: Partial<V2Account>): V2Account => ({
    id,
    ledgerId: "ledger",
    name: id,
    type: "checking",
    currency: "AED",
    openingBalanceMinor: 0,
    balanceMinor: 0,
    archived: false,
    version: 1,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  });

  it("ticks current and cash by default and never offers cards, other currencies, or archived accounts", () => {
    const choice = fundingChoice(
      [
        account("current", {}),
        account("cash", { type: "cash" }),
        account("savings", { type: "savings" }),
        account("card", { type: "credit_card" }),
        account("usd", { currency: "USD" }),
        account("old", { archived: true }),
      ],
      { funding: {}, openingCash: "" },
      "AED",
    );

    expect(choice.accountIds).toEqual(["current", "cash"]);
  });

  it("falls back to the typed total when no account can fund a budget", () => {
    const choice = fundingChoice(
      [account("card", { type: "credit_card" })],
      {
        funding: {},
        openingCash: "250.5",
      },
      "AED",
    );

    expect(choice).toEqual({ accountIds: [], openingCashMinor: 25050, invalid: false });
  });
});

describe("setup draft storage", () => {
  it("round-trips and drops damaged data", () => {
    const draft = { ...emptySetupDraft(), payday: { kind: "day" as const, day: 25 } };

    expect(parseSetupDraft(serializeSetupDraft(draft))).toEqual(draft);
    expect(parseSetupDraft("{not json")).toBeNull();
    expect(parseSetupDraft(null)).toBeNull();
  });
});

describe("review receipt figures", () => {
  it("prints the money you have and the Everyday spending already logged", () => {
    const result = preview({
      facts: facts({
        spendSincePeriodStart: [
          { categoryId: "groceries", accountId: "current", amountMinor: aed(400), onCard: false },
          { categoryId: "fuel", accountId: "current", amountMinor: aed(90), onCard: false },
        ],
      }),
      amounts: { "cat:groceries": "1000" },
    });

    expect(result.cashMinor).toBe(aed(5000));
    // Fuel is not an envelope here, so only the groceries spending is Everyday spending.
    expect(result.everydaySpentMinor).toBe(aed(400));
  });

  it("counts the ticked envelopes per group", () => {
    expect(groupCounts([groceries, rent, item("cat:dining", "everyday", "dining")])).toEqual({
      bills: 0,
      everyday: 2,
      saving: 1,
    });
  });
});
