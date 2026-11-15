import { fireEvent, render, screen } from "@testing-library/react-native";

import { iconPath } from "../../icon/icon-paths";
import { RoundButton } from "../round-button";

describe("RoundButton", () => {
  it.each([
    ["back", "Back", "chevron-left"],
    ["close", "Close", "close"],
    ["more", "More", "more"],
  ] as const)("draws %s with a default label", async (icon, label, glyph) => {
    await render(<RoundButton icon={icon} onPress={jest.fn()} />);
    expect(screen.getByRole("button", { name: label })).toBeTruthy();
    expect(JSON.stringify(screen.toJSON())).toContain(iconPath(glyph, false));
  });

  it("takes a custom label and reports presses", async () => {
    const onPress = jest.fn();
    await render(<RoundButton accessibilityLabel="Back to budget" icon="back" onPress={onPress} />);

    await fireEvent.press(screen.getByRole("button", { name: "Back to budget" }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
  });
});
