import { fireEvent, render, screen } from "@testing-library/react-native";

import { FlowChart } from "../flow-chart";
import {
  flowBarWidth,
  flowChartScale,
  flowChartSummary,
  flowDomainMax,
  flowLinePoints,
  flowRangeLabel,
  formatCompactMoney,
  type FlowDatumLike,
} from "../flow-chart-utils";

const DATA = [
  { label: "May", incomeMinor: 1_200_000, expenseMinor: 840_000 },
  { label: "Jun", incomeMinor: 1_200_000, expenseMinor: 910_000 },
  { label: "Jul", incomeMinor: 1_250_000, expenseMinor: 760_000 },
  { label: "Aug", incomeMinor: 1_200_000, expenseMinor: 1_020_000 },
  { label: "Sep", incomeMinor: 1_320_000, expenseMinor: 880_000 },
  { label: "Oct", incomeMinor: 1_200_000, expenseMinor: 428_600 },
] as const satisfies readonly FlowDatumLike[];

describe("flow chart scale", () => {
  it("shares one domain across both series with 6% headroom", () => {
    expect(flowDomainMax(DATA, 100)).toBeCloseTo(1_399_200);
    expect(flowDomainMax([], 100)).toBe(100);
    expect(flowDomainMax([{ label: "x", incomeMinor: -5, expenseMinor: Number.NaN }], 100)).toBe(
      100,
    );
  });

  it("scales income and spending heights to the plot and keeps order", () => {
    const scale = flowChartScale(DATA, "AED", 128);
    expect(scale.incomeHeights[4]).toBe(121);
    expect(scale.expenseHeights[5]).toBeLessThan(scale.incomeHeights[5] ?? 0);
    expect(scale.incomeHeights.every((height) => height <= 128)).toBe(true);
  });

  it("draws gridlines at 5K and 10K with compact labels", () => {
    const scale = flowChartScale(DATA, "AED", 128);
    expect(scale.ticks.map((tick) => tick.label)).toEqual(["5K", "10K"]);
    const [five, ten] = scale.ticks;
    expect(ten?.y).toBeLessThan(five?.y ?? 0);
  });

  it("formats axis money compactly", () => {
    expect(formatCompactMoney(50_000, "AED")).toBe("500");
    expect(formatCompactMoney(500_000, "AED")).toBe("5K");
    expect(formatCompactMoney(250_000, "AED")).toBe("2.5K");
    expect(formatCompactMoney(120_000_000, "AED")).toBe("1.2M");
    expect(formatCompactMoney(5000, "JPY")).toBe("5K");
  });

  it("sizes bar pairs to the cell, capped at 12pt", () => {
    expect(flowBarWidth(50)).toBe(12);
    expect(flowBarWidth(30)).toBe(10);
    expect(flowBarWidth(4)).toBe(2);
  });

  it("puts line vertices at cell centres, flat at zero", () => {
    const points = flowLinePoints([0, 100], 100, 100, 128);
    expect(points[0]).toEqual({ x: 25, y: 128 });
    expect(points[1]).toEqual({ x: 75, y: 0 });
  });

  it("labels the range from the first and last period", () => {
    expect(flowRangeLabel(DATA, "AED")).toBe("May – Oct · AED");
    expect(flowRangeLabel([], "AED")).toBe("AED");
  });
});

describe("flowChartSummary", () => {
  it("reads ranges, totals and every period", () => {
    const text = flowChartSummary(
      DATA,
      "USD",
      "Income vs spending",
      "May – Oct · USD",
      "Income",
      "Spending",
    );
    expect(text).toContain("Income vs spending, May – Oct · USD.");
    expect(text).toContain("Income between $12,000 and $13,200, total $73,700.");
    expect(text).toContain("Spending between $4,286 and $10,200, total $48,386.");
    expect(text).toContain("May income $12,000.00, spending $8,400.00;");
  });

  it("collapses a flat series to one figure and handles no data", () => {
    const flat = [{ label: "May", incomeMinor: 1000, expenseMinor: 500 }];
    expect(flowChartSummary(flat, "USD", "T", "R", "Income", "Spending")).toContain(
      "Income $10, total $10.",
    );
    expect(flowChartSummary([], "USD", "T", "R", "Income", "Spending")).toBe("T, R. No data.");
  });
});

describe("FlowChart", () => {
  it("exposes the chart as one image with a summary", async () => {
    await render(<FlowChart currency="AED" data={DATA} />);
    const label = screen.getByRole("image").props.accessibilityLabel;
    expect(label).toContain("Income vs spending, May – Oct · AED.");
    expect(label).toContain("Oct income");
  });

  it("starts as bars and swaps to lines through the radio toggle", async () => {
    const onViewChange = jest.fn();
    await render(<FlowChart currency="AED" data={DATA} onViewChange={onViewChange} />);
    expect(screen.getByLabelText("Chart type")).toBeTruthy();
    expect(screen.getByLabelText("Bar chart").props.accessibilityState.checked).toBe(true);
    expect(screen.getByLabelText("Line chart").props.accessibilityState.checked).toBe(false);
    await fireEvent.press(screen.getByLabelText("Line chart"));
    expect(onViewChange).toHaveBeenCalledWith("line");
    expect(screen.getByLabelText("Line chart").props.accessibilityState.checked).toBe(true);
  });

  it("follows a controlled view", async () => {
    await render(<FlowChart currency="AED" data={DATA} view="line" />);
    expect(screen.getByLabelText("Line chart").props.accessibilityState.checked).toBe(true);
  });

  it("prints axis and period labels once measured", async () => {
    await render(<FlowChart currency="AED" data={DATA} />);
    await fireEvent(screen.getByRole("image"), "layout", {
      nativeEvent: { layout: { width: 300, height: 150 } },
    });
    const hidden = { includeHiddenElements: true };
    expect(screen.getByText("10K", hidden)).toBeTruthy();
    expect(screen.getByText("5K", hidden)).toBeTruthy();
    expect(screen.getByText("May", hidden)).toBeTruthy();
    expect(screen.getByText("Oct", hidden)).toBeTruthy();
  });
});
