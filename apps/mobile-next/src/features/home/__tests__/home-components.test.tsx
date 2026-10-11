import { fireEvent, render, screen } from "@testing-library/react-native";

import { HomeBellButton } from "../home-bell-button";
import { HomeEmptyReceipt } from "../home-empty-receipt";
import { HomeFlowCard } from "../home-flow-card";
import { HomeNetWorth } from "../home-net-worth";
import { HomePlanCard } from "../home-plan-card";
import { HomeSafeToSpend } from "../home-safe-to-spend";
import type { HomeMonthFlow } from "../home-summary";
import type { HomeUpcomingItem } from "../home-upcoming-model";
import { HomeUpcomingRow } from "../home-upcoming-row";

const months: HomeMonthFlow[] = ["MAY", "JUN", "JUL", "AUG", "SEP", "OCT"].map((label, index) => ({
  month: `2026-${String(index + 5).padStart(2, "0")}`,
  label,
  incomeMinor: 1_200_000,
  expenseMinor: 840_000 - index * 10_000,
}));

describe("HomeSafeToSpend", () => {
  it("prints the receipt figures and opens the budget as one link", async () => {
    const onPress = jest.fn();
    await render(
      <HomeSafeToSpend
        currency="AED"
        daysLeft={14}
        onPress={onPress}
        perDayMinor={14_200}
        safeToSpendMinor={198_800}
        ticks={["under", "over", "today", "future"]}
      />,
    );
    expect(screen.getByText("AED 1,988")).toBeTruthy();
    expect(screen.getByText("≈ 142 A DAY")).toBeTruthy();
    expect(screen.getByText("14 DAYS 💰")).toBeTruthy();
    const link = screen.getByLabelText(
      "Safe to spend 1,988.00 AED, about 142 a day, 14 days to payday. Open budget",
    );
    await fireEvent.press(link);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("prints an overspent budget with a minus and no daily pace", async () => {
    await render(
      <HomeSafeToSpend
        currency="AED"
        daysLeft={1}
        onPress={jest.fn()}
        perDayMinor={0}
        safeToSpendMinor={-12_050}
        ticks={[]}
      />,
    );
    expect(screen.getByText("−AED 120.50")).toBeTruthy();
    expect(screen.getByText("≈ 0 A DAY")).toBeTruthy();
    expect(screen.getByText("1 DAY 💰")).toBeTruthy();
  });
});

describe("HomePlanCard", () => {
  it("invites planning the month", async () => {
    const onPress = jest.fn();
    await render(<HomePlanCard onPress={onPress} />);
    expect(screen.getByText("Plan your month")).toBeTruthy();
    await fireEvent.press(screen.getByRole("link"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe("HomeFlowCard", () => {
  it("stamps the range and switches views from the toggle", async () => {
    const onViewChange = jest.fn();
    await render(
      <HomeFlowCard currency="AED" months={months} onViewChange={onViewChange} view="bar" />,
    );
    expect(screen.getByText("MAY – OCT · AED")).toBeTruthy();
    // The legend is decorative: the plot's summary carries the same facts for screen readers.
    expect(screen.getByText("MAY → OCT", { includeHiddenElements: true })).toBeTruthy();
    expect(
      screen.getByLabelText(/^Bar chart, income vs spending in AED\. MAY income 12,000/),
    ).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Line chart"));
    expect(onViewChange).toHaveBeenCalledWith("line");
  });
});

describe("HomeUpcomingRow", () => {
  const item: HomeUpcomingItem = {
    key: "du:2026-10-18",
    ruleId: "du",
    date: "2026-10-18",
    title: "du",
    emoji: "📶",
    meta: "IN 7 DAYS · SHORT 75",
    short: true,
    minor: -37_500,
    kind: "expense",
    next: false,
  };

  it("prints the bill without a currency sign and opens its rule", async () => {
    const onPress = jest.fn();
    await render(<HomeUpcomingRow currency="AED" item={item} onPress={onPress} />);
    expect(screen.getByText("−375.00")).toBeTruthy();
    expect(screen.getByText("IN 7 DAYS · SHORT 75")).toBeTruthy();
    await fireEvent.press(
      screen.getByLabelText("du, due 18 October, in 7 days · short 75, minus 375.00 AED"),
    );
    expect(onPress).toHaveBeenCalledWith("du");
  });
});

describe("HomeBellButton", () => {
  it("counts this week's bills and hides the badge at zero", async () => {
    const { rerender } = await render(<HomeBellButton count={2} onPress={jest.fn()} />);
    expect(screen.getByLabelText("Due: 2 bills this week")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    await rerender(<HomeBellButton count={0} onPress={jest.fn()} />);
    expect(screen.getByLabelText("Nothing due this week")).toBeTruthy();
    expect(screen.queryByText("0")).toBeNull();
  });
});

describe("HomeNetWorth", () => {
  it("speaks the balance and the month's change as one summary", async () => {
    await render(<HomeNetWorth balanceMinor={4_952_650} currency="AED" deltaMinor={132_000} />);
    expect(
      screen.getByLabelText("Net worth 49,526.50 AED, up 1,320 since last month"),
    ).toBeTruthy();
    expect(screen.getByText("49,526")).toBeTruthy();
    expect(screen.getByText(".50")).toBeTruthy();
    expect(screen.getByText("▲ 1,320", { includeHiddenElements: true })).toBeTruthy();
  });
});

describe("HomeEmptyReceipt", () => {
  it("starts from the first account, with categories as the quieter path", async () => {
    const onAddAccount = jest.fn();
    const onSetUpCategories = jest.fn();
    await render(
      <HomeEmptyReceipt onAddAccount={onAddAccount} onSetUpCategories={onSetUpCategories} />,
    );
    await fireEvent.press(screen.getByText("Add your first account"));
    await fireEvent.press(screen.getByText("Set up categories"));
    expect(onAddAccount).toHaveBeenCalledTimes(1);
    expect(onSetUpCategories).toHaveBeenCalledTimes(1);
  });
});
