import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { HomeJournalList } from "@/components/home/home-journal-list";
import { createDayGroup } from "@/tests/test-utils/factories";

jest.mock("@shopify/flash-list", () => ({
  FlashList: ({
    data,
    renderItem,
    ListHeaderComponent,
  }: {
    data: unknown[];
    renderItem: ({ item }: { item: unknown }) => React.ReactNode;
    ListHeaderComponent: React.ReactElement;
  }) => {
    const React = require("react");
    const { View } = require("react-native");

    return React.createElement(
      View,
      null,
      ListHeaderComponent,
      data.map((item, index) => React.createElement(View, { key: index }, renderItem({ item }))),
    );
  },
}));

jest.mock("@/components/transaction/transaction-row", () => ({
  TransactionRow: ({ transaction }: { transaction: { id: string } }) => {
    const React = require("react");
    const { Text } = require("react-native");

    return React.createElement(Text, null, `transaction:${transaction.id}`);
  },
}));

jest.mock("@/components/home/journal-day-header", () => ({
  JournalDayHeader: ({ item }: { item: { date: string } }) => {
    const React = require("react");
    const { Text } = require("react-native");

    return React.createElement(Text, null, `header:${item.date}`);
  },
}));

describe("HomeJournalList", () => {
  it("renders journal sections and rows", () => {
    render(
      <HomeJournalList
        groups={[createDayGroup()]}
        currency="USD"
        showAccount
        ListHeaderComponent={<Text>list-header</Text>}
      />,
    );

    expect(screen.getByText("list-header")).toBeOnTheScreen();
    expect(screen.getByText("header:2026-03-28")).toBeOnTheScreen();
    expect(screen.getByText("transaction:transaction-1")).toBeOnTheScreen();
  });
});
