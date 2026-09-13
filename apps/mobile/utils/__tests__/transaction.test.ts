import { createTransactionWithDetails } from "@/tests/test-utils/factories";
import { groupByDay } from "@/utils/transaction";

describe("groupByDay", () => {
  it("groups transactions by date and sorts newest-first", () => {
    const groups = groupByDay([
      createTransactionWithDetails({
        id: "transaction-1",
        date: "2026-03-27",
        type: "expense",
        amount: 20_00,
      }),
      createTransactionWithDetails({
        id: "transaction-2",
        date: "2026-03-28",
        type: "income",
        amount: 50_00,
      }),
      createTransactionWithDetails({
        id: "transaction-3",
        date: "2026-03-28",
        type: "expense",
        amount: 15_00,
      }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      date: "2026-03-28",
      totalIncome: 50_00,
      totalExpense: 15_00,
    });
    expect(groups[0]?.transactions.map((transaction) => transaction.id)).toEqual([
      "transaction-2",
      "transaction-3",
    ]);
    expect(groups[1]).toMatchObject({
      date: "2026-03-27",
      totalIncome: 0,
      totalExpense: 20_00,
    });
  });

  it("does not count transfer rows toward income or expense totals", () => {
    const groups = groupByDay([
      createTransactionWithDetails({
        id: "transaction-transfer",
        date: "2026-03-28",
        type: "transfer",
        amount: 99_00,
      }),
    ]);

    expect(groups[0]).toMatchObject({
      totalIncome: 0,
      totalExpense: 0,
    });
  });
});
