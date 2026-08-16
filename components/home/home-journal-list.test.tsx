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
      item.type === "section-header" ? `header:${item.date}` : `transaction:${item.data.id}`,
    );
  },
}));

describe("HomeJournalList", () => {
  it("renders journal sections and rows", async () => {
    await render(
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
