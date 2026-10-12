import { fireEvent, render, screen } from "@testing-library/react-native";

import { iconPath } from "../../icon/icon-paths";
import { SheetLink } from "../sheet-link";
import { SheetLinkGroup } from "../sheet-link-group";

describe("SheetLink", () => {
  it("is a link with a chevron", async () => {
    const onPress = jest.fn();
    await render(<SheetLink emoji="⚙️" label="Settings" onPress={onPress} />);
    await fireEvent.press(screen.getByRole("link", { name: "Settings" }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(screen.toJSON())).toContain(iconPath("chevron-right", false));
  });
});

describe("SheetLinkGroup", () => {
  it("stacks links and reads each meta", async () => {
    const onMembers = jest.fn();
    const onSettings = jest.fn();
    await render(
      <SheetLinkGroup
        links={[
          { emoji: "👥", label: "Household members", meta: "You, Sara", onPress: onMembers },
          { emoji: "⚙️", label: "Settings", onPress: onSettings },
        ]}
      />,
    );
    await fireEvent.press(screen.getByRole("link", { name: "Household members, You, Sara" }));
    await fireEvent.press(screen.getByRole("link", { name: "Settings" }));
    expect(onMembers).toHaveBeenCalledTimes(1);
    expect(onSettings).toHaveBeenCalledTimes(1);
  });
});
