import { fireEvent, render, screen } from "@testing-library/react-native";

import { RecentJournalSection } from "@/components/home/recent-journal-section";
import { createDayGroup, createTransactionWithDetails } from "@/tests/test-utils/factories";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  router: { push: (href: string) => mockPush(href) },
}));

jest.mock("@/components/home/journal-list-item-row", () => ({
  JournalListItemRow: ({
    item,
  }: {
    item: { type: "section-header"; date: string } | { type: "transaction"; data: { id: string } };
  }) => {
    const React = require("react");
    const { Text } = require("react-native");

    return React.createElement(
      Text,
      null,
      item.type === "section-header" ? `day:${item.date}` : `transaction:${item.data.id}`,
    );
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

  // Regression for #192: the loading, empty, and populated states are
  // separate Reanimated-animated branches that replace one another as
  // PowerSync data and filters change. Each transition must land with the
  // full expected content rendered rather than a stale or partial subtree.
  it("renders full content at every step of a loading -> populated -> filtered -> populated transition", async () => {
    const onResetFilters = jest.fn();
    const { rerender } = await render(
      <RecentJournalSection
        activeFilterCount={0}
        currency="USD"
        groups={[]}
        isLoading
        onResetFilters={onResetFilters}
        showAccount
      />,
    );

    expect(screen.queryByText("day:2026-03-28")).not.toBeOnTheScreen();

    // PowerSync finishes hydrating with one row.
    await rerender(
      <RecentJournalSection
        activeFilterCount={0}
        currency="USD"
        groups={[createDayGroup()]}
        isLoading={false}
        onResetFilters={onResetFilters}
        showAccount
      />,
    );

    expect(screen.getByText("day:2026-03-28")).toBeOnTheScreen();
    expect(screen.getByText("transaction:transaction-1")).toBeOnTheScreen();

    // A live insert adds a second row on the same day (simulates a
    // PowerSync-driven revision bump while the card is already populated).
    await rerender(
      <RecentJournalSection
        activeFilterCount={0}
        currency="USD"
        groups={[
          createDayGroup({
            transactions: [
              createTransactionWithDetails({ id: "transaction-1" }),
              createTransactionWithDetails({ id: "transaction-2" }),
            ],
          }),
        ]}
        isLoading={false}
        onResetFilters={onResetFilters}
        showAccount
      />,
    );

    expect(screen.getByText("transaction:transaction-1")).toBeOnTheScreen();
    expect(screen.getByText("transaction:transaction-2")).toBeOnTheScreen();

    // A filter is applied that excludes every transaction.
    await rerender(
      <RecentJournalSection
        activeFilterCount={1}
        currency="USD"
        groups={[]}
        isLoading={false}
        onResetFilters={onResetFilters}
        showAccount
      />,
    );

    expect(screen.queryByText("transaction:transaction-1")).not.toBeOnTheScreen();
    expect(screen.getByText("Reset Filters")).toBeOnTheScreen();

    // The filter is cleared and the original content returns in full.
    await rerender(
      <RecentJournalSection
        activeFilterCount={0}
        currency="USD"
        groups={[createDayGroup()]}
        isLoading={false}
        onResetFilters={onResetFilters}
        showAccount
      />,
    );

    expect(screen.getByText("day:2026-03-28")).toBeOnTheScreen();
    expect(screen.getByText("transaction:transaction-1")).toBeOnTheScreen();
    expect(screen.queryByText("transaction:transaction-2")).not.toBeOnTheScreen();
  });
});
