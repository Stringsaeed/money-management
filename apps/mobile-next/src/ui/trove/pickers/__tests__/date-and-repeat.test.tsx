import { fireEvent, render, screen } from "@testing-library/react-native";

import { DateSheet } from "../date-sheet";
import {
  keyFromPickerValue,
  parseDateKey,
  pickerValueFromKey,
  quickDateChips,
  toDateKey,
} from "../date-utils";
import { RepeatOptions } from "../repeat-options";
import { repeatChoices, repeatSentence } from "../repeat-utils";

// Saturday 10 October 2026, local noon so no time zone moves the day.
const TODAY = new Date(2026, 9, 10, 12);

describe("repeat sentences", () => {
  it("builds plain-text sentences from the picked date", () => {
    expect(repeatSentence("none", TODAY)).toBe("Doesn't repeat");
    expect(repeatSentence("weekly", TODAY)).toBe("Every week on Saturday");
    expect(repeatSentence("monthly", TODAY)).toBe("Every month on the 10th");
    expect(repeatSentence("yearly", TODAY)).toBe("Every year on 10 October");
  });

  it("uses the right ordinal suffix", () => {
    expect(repeatSentence("monthly", new Date(2026, 9, 1))).toBe("Every month on the 1st");
    expect(repeatSentence("monthly", new Date(2026, 9, 2))).toBe("Every month on the 2nd");
    expect(repeatSentence("monthly", new Date(2026, 9, 23))).toBe("Every month on the 23rd");
    expect(repeatSentence("monthly", new Date(2026, 9, 11))).toBe("Every month on the 11th");
  });

  it("lists the four choices in board order", () => {
    expect(repeatChoices(TODAY).map((choice) => choice.rule)).toEqual([
      "none",
      "weekly",
      "monthly",
      "yearly",
    ]);
  });
});

describe("date helpers", () => {
  it("builds quick chips relative to today, across a month boundary", () => {
    expect(quickDateChips(TODAY)).toEqual([
      { id: "today", label: "Today", dateKey: "2026-10-10" },
      { id: "yesterday", label: "Yesterday", dateKey: "2026-10-09" },
      { id: "two-days-ago", label: "2 days ago", dateKey: "2026-10-08" },
    ]);
    expect(quickDateChips(new Date(2026, 10, 1)).map((chip) => chip.dateKey)).toEqual([
      "2026-11-01",
      "2026-10-31",
      "2026-10-30",
    ]);
  });

  it("rejects malformed and impossible keys", () => {
    expect(parseDateKey("2026-10-10")).not.toBeNull();
    expect(parseDateKey("2026-02-31")).toBeNull();
    expect(parseDateKey("10/10/2026")).toBeNull();
  });

  it("round-trips a key through the native UTC-midnight picker value", () => {
    const picked = pickerValueFromKey("2026-10-10", TODAY);
    expect(picked.toISOString()).toBe("2026-10-10T00:00:00.000Z");
    expect(keyFromPickerValue(picked)).toBe("2026-10-10");
    expect(keyFromPickerValue(pickerValueFromKey("nonsense", TODAY))).toBe(toDateKey(TODAY));
  });
});

describe("RepeatOptions", () => {
  it("marks the picked rule and reports a new choice", async () => {
    const onChange = jest.fn();
    await render(<RepeatOptions date="2026-10-10" onChange={onChange} value="monthly" />);
    expect(
      screen.getByRole("radio", { name: "Every month on the 10th" }).props.accessibilityState,
    ).toMatchObject({ checked: true });
    expect(
      screen.getByRole("radio", { name: "Every week on Saturday" }).props.accessibilityState,
    ).toMatchObject({ checked: false });
    await fireEvent.press(screen.getByRole("radio", { name: "Every year on 10 October" }));
    expect(onChange).toHaveBeenCalledWith("yearly");
  });
});

describe("DateSheet", () => {
  it("selects the chip matching the value and changes the date from a chip", async () => {
    const onChange = jest.fn();
    await render(
      <DateSheet onChange={onChange} onDismiss={jest.fn()} open today={TODAY} value="2026-10-10" />,
    );
    expect(screen.getByRole("button", { name: "Today" }).props.accessibilityState).toMatchObject({
      selected: true,
    });
    await fireEvent.press(screen.getByRole("button", { name: "Yesterday" }));
    expect(onChange).toHaveBeenCalledWith("2026-10-09");
  });

  it("dismisses from Done and only shows repeat when asked", async () => {
    const onDismiss = jest.fn();
    const { rerender } = await render(
      <DateSheet
        onChange={jest.fn()}
        onDismiss={onDismiss}
        open
        today={TODAY}
        value="2026-10-10"
      />,
    );
    expect(screen.queryByRole("radiogroup")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Done" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    await rerender(
      <DateSheet
        onChange={jest.fn()}
        onDismiss={onDismiss}
        onRepeatChange={jest.fn()}
        open
        repeat="none"
        today={TODAY}
        value="2026-10-10"
      />,
    );
    expect(screen.getByRole("radio", { name: "Every month on the 10th" })).toBeTruthy();
  });
});
