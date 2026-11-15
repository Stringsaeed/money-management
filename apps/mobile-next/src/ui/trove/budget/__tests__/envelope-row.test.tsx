import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { colors } from "../../tokens";
import { EnvelopeBar } from "../envelope-bar";
import { EnvelopeRow } from "../envelope-row";

const BASE = {
  emoji: "🛒",
  name: "Groceries",
  sub: "AED 42 a day",
  leftLabel: "588",
  ofLabel: "of 1,600",
  progress: 0.63,
  pace: 0.55,
  accessibilityLabel: "Groceries: 588 dirhams left of 1,600",
} as const;

const rootElement = () => {
  const root = screen.root;
  if (!root) throw new Error("expected a rendered root");
  return root;
};

describe("EnvelopeRow", () => {
  it("is one button that fires press and long press", async () => {
    const onPress = jest.fn();
    const onLongPress = jest.fn();
    await render(<EnvelopeRow {...BASE} onLongPress={onLongPress} onPress={onPress} />);
    const row = screen.getByRole("button", { name: BASE.accessibilityLabel });
    await fireEvent.press(row);
    await fireEvent(row, "longPress");
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it("is a plain labelled row without handlers", async () => {
    await render(<EnvelopeRow {...BASE} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByLabelText(BASE.accessibilityLabel)).toBeTruthy();
  });

  it("turns the figure, sub and bar red when over", async () => {
    await render(
      <EnvelopeRow {...BASE} leftLabel="−175" progress={1.3} state="over" sub="Over by 175" />,
    );
    const color = (text: string) =>
      StyleSheet.flatten(screen.getByText(text, { includeHiddenElements: true }).props.style).color;
    expect(color("−175")).toEqual(colors.negative.text);
    expect(color("Over by 175")).toEqual(colors.negative.text);
  });

  it("greys the unknown figure and hides the pace tick when pace is null", async () => {
    await render(
      <EnvelopeRow
        {...BASE}
        leftLabel="—"
        ofLabel=""
        pace={null}
        progress={0}
        state="unknown"
        sub="—"
      />,
    );
    expect(
      StyleSheet.flatten(screen.getAllByText("—", { includeHiddenElements: true })[1]?.props.style)
        .color,
    ).toEqual(colors.text.tertiary);
    expect(JSON.stringify(screen.toJSON())).not.toContain('"top":-3');
  });

  it("places the pace tick at the period share", async () => {
    await render(<EnvelopeRow {...BASE} />);
    expect(JSON.stringify(screen.toJSON())).toContain('"left":"55%"');
  });
});

describe("EnvelopeBar", () => {
  const printed = () => JSON.stringify(screen.toJSON());

  it("draws the fill only once it knows its width", async () => {
    await render(<EnvelopeBar over={false} pace={0.5} progress={0.63} />);
    expect(printed()).not.toContain(JSON.stringify(colors.text.secondary));
    await fireEvent(rootElement(), "layout", {
      nativeEvent: { layout: { height: 6, width: 300, x: 0, y: 0 } },
    });
    expect(printed()).toContain(JSON.stringify(colors.text.secondary));
  });

  it("fills in negative when over", async () => {
    await render(<EnvelopeBar over pace={0.5} progress={1.3} />);
    await fireEvent(rootElement(), "layout", {
      nativeEvent: { layout: { height: 6, width: 300, x: 0, y: 0 } },
    });
    expect(printed()).toContain(JSON.stringify(colors.negative.text));
    expect(printed()).not.toContain(JSON.stringify(colors.text.secondary));
  });
});
