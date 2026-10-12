import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { colors } from "../../tokens";
import { SafeToSpend } from "../safe-to-spend";
import { SafeToSpendError } from "../safe-to-spend-error";
import { SafeToSpendSkeleton } from "../safe-to-spend-skeleton";
import type { RunwayTick } from "../runway-strip";

const TICKS: readonly RunwayTick[] = ["under", "over", "today", "future"];
const RUNWAY = "Day 3 of 4. 1 day under your daily amount, 1 over. 2 days to payday.";

const flatStyle = (text: string) => StyleSheet.flatten(screen.getByText(text).props.style);

describe("SafeToSpend", () => {
  it("speaks the figure, the pace and the runway", async () => {
    await render(
      <SafeToSpend
        currency="AED"
        daysEmoji="💰"
        daysLeft={14}
        perDayMinor={14_200}
        runwayLabel={RUNWAY}
        safeMinor={198_800}
        ticks={TICKS}
      />,
    );
    expect(screen.getByLabelText("Safe to spend: 1,988.00 AED")).toBeTruthy();
    expect(screen.getByText("1,988")).toBeTruthy();
    expect(screen.getByLabelText("about 142 AED a day")).toBeTruthy();
    expect(screen.getByText("≈ AED 142 A DAY")).toBeTruthy();
    expect(screen.getByRole("image", { name: RUNWAY })).toBeTruthy();
    expect(screen.getByText("14 DAYS 💰", { includeHiddenElements: true })).toBeTruthy();
    expect(flatStyle("1,988").color).toEqual(colors.text.primary);
  });

  it("prints a negative figure in red with a minus and a zero pace", async () => {
    await render(
      <SafeToSpend
        currency="AED"
        daysLeft={1}
        perDayMinor={0}
        runwayLabel={RUNWAY}
        safeMinor={-24_000}
        ticks={TICKS}
      />,
    );
    expect(flatStyle("−240").color).toEqual(colors.negative.text);
    expect(screen.getByText("AED 0 A DAY")).toBeTruthy();
    expect(screen.getByText("1 DAY", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByLabelText("Safe to spend: minus 240.00 AED")).toBeTruthy();
  });

  it("draws one tick per day", async () => {
    await render(
      <SafeToSpend
        currency="USD"
        daysLeft={2}
        perDayMinor={1_000}
        runwayLabel={RUNWAY}
        safeMinor={2_000}
        ticks={TICKS}
      />,
    );
    expect(screen.getByRole("image", { name: RUNWAY })).toBeTruthy();
    const ticks = JSON.stringify(screen.toJSON()).match(/"borderRadius":2,"flex":1/g);
    expect(ticks).toHaveLength(TICKS.length);
  });
});

describe("SafeToSpendSkeleton", () => {
  it("announces loading as busy", async () => {
    await render(<SafeToSpendSkeleton />);
    const skeleton = screen.getByLabelText("Loading your budget");
    expect(skeleton.props.accessibilityState).toEqual({ busy: true });
  });
});

describe("SafeToSpendError", () => {
  it("is an alert with a Retry button", async () => {
    const onRetry = jest.fn();
    await render(
      <SafeToSpendError
        message="Everything you logged is saved."
        onRetry={onRetry}
        title="Couldn't calculate right now"
      />,
    );
    expect(screen.root?.props.accessibilityRole).toBe("alert");
    expect(screen.getByRole("header", { name: "Couldn't calculate right now" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
