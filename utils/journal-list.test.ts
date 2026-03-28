import { createDayGroup, createTransactionWithDetails } from "@/tests/test-utils/factories";
import { buildJournalList } from "@/utils/journal-list";

describe("buildJournalList", () => {
  it("builds section headers and transaction items in order", () => {
    const items = buildJournalList(
      [
        createDayGroup({
          date: "2026-03-28",
          transactions: [
            createTransactionWithDetails({ id: "transaction-1" }),
            createTransactionWithDetails({ id: "transaction-2" }),
          ],
          totalExpense: 90_00,
        }),
      ],
      "USD",
      true,
    );

    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({
      type: "section-header",
      date: "2026-03-28",
      currency: "USD",
      totalExpense: 90_00,
    });
    expect(items[1]).toMatchObject({
      type: "transaction",
      showAccount: true,
      isLast: false,
    });
    expect(items[2]).toMatchObject({
      type: "transaction",
      showAccount: true,
      isLast: true,
    });
  });
});
