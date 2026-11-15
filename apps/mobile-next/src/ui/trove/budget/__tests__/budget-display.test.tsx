import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { colors } from "../../tokens";
import { DueBell } from "../due-bell";
import { RunwayLegend } from "../runway-legend";
import { RunwayStrip } from "../runway-strip";
import { StatusPill } from "../status-pill";
import { SummaryTicket } from "../summary-ticket";

describe("RunwayStrip", () => {
  it("sizes each tick by kind and stays out of assistive tech", async () => {
    await render(<RunwayStrip ticks={["under", "over", "today", "future"]} />);
    const root = screen.toJSON();
    if (!root || Array.isArray(root)) throw new Error("expected a single root node");
    expect(root.props.accessibilityElementsHidden).toBe(true);
    const heights = [...JSON.stringify(root).matchAll(/"height":(\d+)/g)].map((match) =>
      Number(match[1]),
    );
    // The strip itself is 16pt tall; then one tick per day.
    expect(heights).toEqual([16, 7, 12, 16, 4]);
  });
});

describe("RunwayLegend", () => {
  it("names the four tick kinds", async () => {
    await render(<RunwayLegend />);
    for (const label of ["Under", "Over", "Today", "To come"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });
});

describe("SummaryTicket", () => {
  it("is a link with the caller's label", async () => {
    const onPress = jest.fn();
    await render(
      <SummaryTicket
        accessibilityLabel="Bills: 2 of 4 paid, next · Car loan today"
        emoji="🧾"
        label="BILLS"
        onPress={onPress}
        sub="next · Car loan today"
        value="2 of 4 paid"
      />,
    );
    await fireEvent.press(
      screen.getByRole("link", { name: "Bills: 2 of 4 paid, next · Car loan today" }),
    );
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe("StatusPill", () => {
  it.each([
    ["paid", colors.fill.neutral, colors.text.secondary],
    ["ready", colors.accent.subtle, colors.accent.text],
    ["short", colors.warning.subtle, colors.warning.text],
    ["track", colors.accent.subtle, colors.accent.text],
  ] as const)("tints %s", async (status, fill, ink) => {
    await render(<StatusPill label="Label" status={status} />);
    const pill = screen.getByLabelText("Label");
    expect(StyleSheet.flatten(pill.props.style).backgroundColor).toEqual(fill);
    expect(StyleSheet.flatten(screen.getByText("Label").props.style).color).toEqual(ink);
  });

  it("speaks an override label", async () => {
    await render(
      <StatusPill accessibilityLabel="Short by 75 dirhams" label="Short 75" status="short" />,
    );
    expect(screen.getByLabelText("Short by 75 dirhams")).toBeTruthy();
  });
});

describe("DueBell", () => {
  it("is a labelled button with a count badge", async () => {
    const onPress = jest.fn();
    await render(
      <DueBell accessibilityLabel="Due: 2 bills this week" count={2} onPress={onPress} />,
    );
    await fireEvent.press(screen.getByRole("button", { name: "Due: 2 bills this week" }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByText("2", { includeHiddenElements: true })).toBeTruthy();
  });

  it("caps the badge at 9+ and hides it at zero", async () => {
    await render(
      <>
        <DueBell accessibilityLabel="Due: 12 bills" count={12} onPress={jest.fn()} />
        <DueBell accessibilityLabel="Nothing due" count={0} onPress={jest.fn()} />
      </>,
    );
    expect(screen.getByText("9+", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByText("0", { includeHiddenElements: true })).toBeNull();
  });
});
