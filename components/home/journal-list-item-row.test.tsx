import { render, screen } from "@testing-library/react-native";

import { JournalListItemRow } from "@/components/home/journal-list-item-row";
import { createTransactionWithDetails } from "@/tests/test-utils/factories";

jest.mock("@/components/home/journal-day-header", () => ({
  JournalDayHeader: ({ item }: { item: { date: string } }) => {
    const React = require("react");
    const { Text } = require("react-native");

    return React.createElement(Text, null, `day:${item.date}`);
  },
}));

jest.mock("@/components/transaction/transaction-row", () => ({
  TransactionRow: ({ transaction }: { transaction: { id: string } }) => {
    const React = require("react");
    const { Text } = require("react-native");

    return React.createElement(Text, null, `transaction:${transaction.id}`);
  },
}));

describe("JournalListItemRow", () => {
  it("renders journal day headers", async () => {
    await render(
      <JournalListItemRow
        item={{
          type: "section-header",
          date: "2026-03-28",
          totalIncome: 0,
          totalExpense: 0,
          currency: "USD",
        }}
      />,
    );

    expect(screen.getByText("day:2026-03-28")).toBeOnTheScreen();
  });

  it("renders transaction rows", async () => {
    await render(
      <JournalListItemRow
        item={{
          type: "transaction",
          data: createTransactionWithDetails({ id: "transaction-2" }),
          showAccount: true,
          isLast: false,
        }}
      />,
    );

    expect(screen.getByText("transaction:transaction-2")).toBeOnTheScreen();
  });
});
