import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { colors } from "../../tokens";
import { AttentionSlot } from "../attention-slot";

describe("AttentionSlot", () => {
  it("presses the action and the sub link separately", async () => {
    const onAction = jest.fn();
    const onSubPress = jest.fn();
    await render(
      <AttentionSlot
        actionLabel="Mark paid"
        emoji="🧾"
        onAction={onAction}
        onSubPress={onSubPress}
        sub="+1 more ›"
        title="Car loan · AED 1,850 due today"
        tone="warn"
      />,
    );
    expect(screen.root?.props).toMatchObject({
      accessibilityLiveRegion: "polite",
      accessibilityRole: "summary",
    });
    expect(screen.getByText("Car loan · AED 1,850 due today")).toBeTruthy();
    await fireEvent.press(screen.getByRole("link", { name: "+1 more ›" }));
    expect(onSubPress).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByRole("button", { name: "Mark paid" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("keeps a plain sub line when it does not link", async () => {
    await render(
      <AttentionSlot
        actionLabel="Cover it"
        glyph="!"
        onAction={jest.fn()}
        sub="It's coming out of Safe to spend"
        title="Dining & coffee is over by AED 175"
        tone="neg"
      />,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("!", { includeHiddenElements: true })).toBeTruthy();
    expect(
      StyleSheet.flatten(screen.getByText("!", { includeHiddenElements: true }).props.style).color,
    ).toEqual(colors.negative.on);
  });

  it("sets a member initial in ink on their colour", async () => {
    await render(
      <AttentionSlot
        actionLabel="Activity"
        avatarColor="#7FB8FF"
        glyph="S"
        onAction={jest.fn()}
        title="Sara added AED 120 · Groceries"
        tone="accent"
      />,
    );
    const initial = screen.getByText("S", { includeHiddenElements: true });
    expect(StyleSheet.flatten(initial.props.style).color).toEqual(colors.paper.ink);
  });

  it("uses the denser kit sizes when small", async () => {
    await render(
      <AttentionSlot
        actionLabel="Got paid"
        emoji="💰"
        onAction={jest.fn()}
        size="sm"
        title="Payday. Did your salary land?"
        tone="accent"
      />,
    );
    expect(
      StyleSheet.flatten(screen.getByText("Payday. Did your salary land?").props.style),
    ).toMatchObject({
      fontSize: 14,
      lineHeight: 19,
    });
  });
});
