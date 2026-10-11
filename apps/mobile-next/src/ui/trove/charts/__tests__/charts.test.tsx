import { fireEvent, render, screen } from "@testing-library/react-native";
import { addDays, format, parseISO } from "date-fns";
import type { ReactElement } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { BalanceChart } from "../balance-chart";
import { CategoryBreakdown } from "../category-breakdown";
import { ColumnChart } from "../column-chart";
import { StatTile } from "../stat-tile";

const series = (start: string, values: readonly number[]) =>
  values.map((minor, index) => ({
    date: format(addDays(parseISO(start), index), "yyyy-MM-dd"),
    minor,
  }));

const COLUMN_DATA = series(
  "2026-09-26",
  [42, 18, 96, 0, 64, 120, 38, 22, 54, 210, 30, 12, 0, 76].map((dollars) => dollars * 100),
);
const BALANCE_DATA = series(
  "2026-09-10",
  Array.from({ length: 30 }, (_, index) => 1_120_000 + index * 4_000),
);

const renderChart = (ui: ReactElement) =>
  render(<GestureHandlerRootView>{ui}</GestureHandlerRootView>);

describe("ColumnChart", () => {
  it("summarises the period for screen readers", async () => {
    await renderChart(<ColumnChart currency="USD" data={COLUMN_DATA} />);
    const label = screen.getByRole("image").props.accessibilityLabel;
    expect(label).toContain("Daily spending, Last 14 days.");
    expect(label).toContain("Average $56 a day.");
    expect(label).toContain("Highest $210.00 on Oct 5.");
    expect(label).toContain("Sep 26 $42.00");
    expect(label).toContain("Today $76.00");
  });

  it("draws columns, gridlines, the average and a today tooltip once measured", async () => {
    await renderChart(<ColumnChart currency="USD" data={COLUMN_DATA} />);
    await fireEvent(screen.getByRole("image"), "layout", {
      nativeEvent: { layout: { width: 352, height: 180 } },
    });
    const hidden = { includeHiddenElements: true };
    expect(screen.getByText("Today · ", hidden)).toBeTruthy();
    expect(screen.getByText("$76.00", hidden)).toBeTruthy();
    expect(screen.getByText("Avg $56", hidden)).toBeTruthy();
    expect(screen.getByText("$100", hidden)).toBeTruthy();
    expect(screen.getByText("$200", hidden)).toBeTruthy();
    expect(screen.getByText("Sep 26", hidden)).toBeTruthy();
    expect(screen.getByText("Oct 9", hidden)).toBeTruthy();
  });

  it("accepts a custom title, subtitle and current-period name", async () => {
    await renderChart(
      <ColumnChart
        currency="USD"
        currentLabel="This week"
        data={COLUMN_DATA}
        subtitle="Two weeks"
        title="Spending"
      />,
    );
    const label = screen.getByRole("image").props.accessibilityLabel;
    expect(label).toContain("Spending, Two weeks.");
    expect(label).toContain("This week $76.00");
  });

  it("reads as empty rather than crashing without data", async () => {
    await renderChart(<ColumnChart currency="USD" data={[]} />);
    expect(screen.getByRole("image").props.accessibilityLabel).toBe(
      "Daily spending, Last 0 days. No spending.",
    );
  });
});

describe("BalanceChart", () => {
  it("describes the start, end and range of the balance", async () => {
    await renderChart(<BalanceChart currency="USD" data={BALANCE_DATA} />);
    const label = screen.getByRole("image").props.accessibilityLabel;
    expect(label).toContain("Balance, Last 30 days.");
    expect(label).toContain("From $11,200.00 on Sep 10 to $12,360.00 today, up $1,160.00.");
    expect(label).toContain("Lowest $11,200.00, highest $12,360.00.");
  });

  it("draws the line with a today tooltip once measured", async () => {
    await renderChart(<BalanceChart currency="USD" data={BALANCE_DATA} />);
    await fireEvent(screen.getByRole("image"), "layout", {
      nativeEvent: { layout: { width: 352, height: 180 } },
    });
    const hidden = { includeHiddenElements: true };
    expect(screen.getByText("Today · ", hidden)).toBeTruthy();
    expect(screen.getByText("$12,360.00", hidden)).toBeTruthy();
    expect(screen.getByText("Sep 10", hidden)).toBeTruthy();
  });

  it("reads as empty rather than crashing without data", async () => {
    await renderChart(<BalanceChart currency="USD" data={[]} />);
    expect(screen.getByRole("image").props.accessibilityLabel).toBe(
      "Balance, Last 0 days. No data.",
    );
  });
});

describe("CategoryBreakdown", () => {
  const categories = [
    { id: "g", name: "Groceries", minor: 42_000, colorKey: "groceries" as const },
    { id: "d", name: "Dining out", minor: 23_600, colorKey: "dining" as const },
    { id: "b", name: "Bills", minor: 31_000, colorKey: "bills" as const },
  ];

  it("summarises the bar and lists every slice with amount and share", async () => {
    await renderChart(<CategoryBreakdown categories={categories} currency="USD" />);
    expect(screen.getByRole("image").props.accessibilityLabel).toBe(
      "Where it went, $966 total. Groceries $420.00, 43 percent; Dining out $236.00, 24 percent; Bills $310.00, 32 percent.",
    );
    expect(screen.getByLabelText("Groceries, $420.00, 43 percent")).toBeTruthy();
    expect(screen.getByText("43.5%")).toBeTruthy();
  });

  it("folds categories past six into Other", async () => {
    const many = Array.from({ length: 8 }, (_, index) => ({
      id: `c${index}`,
      name: `Cat ${index}`,
      minor: 1_000 - index * 10,
    }));
    await renderChart(<CategoryBreakdown categories={many} currency="USD" />);
    expect(screen.getAllByLabelText(/percent$/)).toHaveLength(7);
    expect(screen.getByText("Other")).toBeTruthy();
  });
});

describe("StatTile", () => {
  it("reads label, amount and change as one element", async () => {
    await renderChart(
      <StatTile
        changeLabel="vs Sep"
        changePercent={-8}
        currency="USD"
        label="Spent in October"
        minor={128_400}
        trend={[1520, 1410, 1600, 1284]}
      />,
    );
    expect(screen.getByLabelText("Spent in October, $1,284.00, down 8% vs Sep")).toBeTruthy();
    expect(screen.getByText("8% vs Sep")).toBeTruthy();
  });

  it("omits the change pill without a comparison", async () => {
    await renderChart(<StatTile currency="USD" label="Spent" minor={100} />);
    expect(screen.getByLabelText("Spent, $1.00")).toBeTruthy();
    expect(screen.queryByText(/vs/)).toBeNull();
  });
});
