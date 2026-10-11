import { fireEvent, render, screen } from "@testing-library/react-native";

import { DateChip } from "../date-chip";
import { dateChipParts } from "../date-chip-utils";
import { SoonBadge } from "../soon-badge";
import { UpcomingRow } from "../upcoming-row";
import { dueInLabel, nextUpcomingIndex, upcomingRowLabel } from "../upcoming-utils";

describe("dateChipParts", () => {
  it("splits an ISO date into month, day and one spoken date", () => {
    expect(dateChipParts("2026-10-12")).toEqual({
      month: "Oct",
      day: "12",
      spoken: "12 October",
    });
    expect(dateChipParts("2026-03-05").day).toBe("5");
  });
});

describe("DateChip", () => {
  it("reads as a single date", async () => {
    await render(<DateChip date="2026-10-12" />);
    const chip = screen.getByLabelText("12 October");
    expect(chip.props.accessible).toBe(true);
    expect(screen.getByText("Oct")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
  });

  it("hides from screen readers when decorative", async () => {
    await render(<DateChip date="2026-10-12" decorative />);
    expect(screen.queryByLabelText("12 October")).toBeNull();
  });
});

describe("nextUpcomingIndex", () => {
  const dates = ["2026-10-25", "2026-10-12", "2026-10-15", "2026-10-01"];

  it("picks the earliest date that is today or later", () => {
    expect(nextUpcomingIndex(dates, "2026-10-10")).toBe(1);
    expect(nextUpcomingIndex(dates, "2026-10-12")).toBe(1);
    expect(nextUpcomingIndex(dates, "2026-10-13")).toBe(2);
  });

  it("returns -1 when everything is past or the list is empty", () => {
    expect(nextUpcomingIndex(dates, "2026-11-01")).toBe(-1);
    expect(nextUpcomingIndex([], "2026-10-10")).toBe(-1);
  });
});

describe("dueInLabel", () => {
  it("counts calendar days from today", () => {
    expect(dueInLabel("2026-10-10", "2026-10-10")).toBe("TODAY");
    expect(dueInLabel("2026-10-11", "2026-10-10")).toBe("TOMORROW");
    expect(dueInLabel("2026-10-12", "2026-10-10")).toBe("IN 2 DAYS");
    expect(dueInLabel("2026-10-09", "2026-10-10")).toBe("YESTERDAY");
    expect(dueInLabel("2026-10-07", "2026-10-10")).toBe("3 DAYS AGO");
  });
});

describe("upcomingRowLabel", () => {
  const base = {
    date: "2026-10-12",
    title: "Rent",
    subtitle: "IN 2 DAYS · RECURRING",
    minor: -650000,
    currency: "USD",
    next: false,
    signDisplay: "always",
  } as const;

  it("speaks title, due date, caption and amount", () => {
    const label = upcomingRowLabel(base);
    expect(label).toMatch(/^Rent, due 12 October, IN 2 DAYS · RECURRING, /);
    expect(label).toContain("6,500");
  });

  it("marks the next item and says plus for money in", () => {
    expect(upcomingRowLabel({ ...base, next: true })).toContain("next due 12 October");
    expect(upcomingRowLabel({ ...base, minor: 1200000 })).toMatch(/, plus /);
  });
});

describe("UpcomingRow", () => {
  it("is one button that speaks the whole row and fires onPress", async () => {
    const onPress = jest.fn();
    await render(
      <UpcomingRow
        currency="USD"
        date="2026-10-12"
        emoji="🏠"
        minor={-650000}
        next
        onPress={onPress}
        subtitle="IN 2 DAYS · RECURRING"
        title="Rent"
      />,
    );
    const row = screen.getByRole("button");
    expect(row.props.accessibilityLabel).toContain("Rent, next due 12 October");
    await fireEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText("12 October")).toBeNull();
  });

  it("is plain text without onPress", async () => {
    await render(<UpcomingRow currency="USD" date="2026-10-25" minor={1200000} title="Salary" />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByLabelText(/^Salary, due 25 October, plus /)).toBeTruthy();
  });
});

describe("SoonBadge", () => {
  it("prints the full or compact label and always speaks Coming soon", async () => {
    await render(
      <>
        <SoonBadge />
        <SoonBadge compact />
      </>,
    );
    expect(screen.getByText("Coming soon")).toBeTruthy();
    expect(screen.getByText("Soon")).toBeTruthy();
    expect(screen.getAllByLabelText("Coming soon")).toHaveLength(2);
  });
});
