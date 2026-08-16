import { fireEvent, render, screen } from "@testing-library/react-native";

import { RecentJournalSection } from "@/components/home/recent-journal-section";
import { createDayGroup } from "@/tests/test-utils/factories";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  router: { push: (href: string) => mockPush(href) },
}));

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

describe("RecentJournalSection", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders recent transactions inside the section", async () => {
    await render(
      <RecentJournalSection
        activeFilterCount={0}
        currency="USD"
        groups={[createDayGroup()]}
        isLoading={false}
        onResetFilters={jest.fn()}
        showAccount
      />,
    );

    expect(screen.getByText("day:2026-03-28")).toBeOnTheScreen();
    expect(screen.getByText("transaction:transaction-1")).toBeOnTheScreen();
  });

  it("opens the full ledger", async () => {
    await render(
      <RecentJournalSection
        activeFilterCount={0}
        currency="USD"
        groups={[]}
        isLoading={false}
        onResetFilters={jest.fn()}
        showAccount
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: "View all recent transactions" }));

    expect(mockPush).toHaveBeenCalledWith("/ledger");
  });
});
