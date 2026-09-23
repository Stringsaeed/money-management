import { fireEvent, render, screen } from "@testing-library/react-native";

import { CreateTabButton } from "../create-tab-button";

describe("CreateTabButton", () => {
  it("dispatches the injected create action on tap", async () => {
    const onCreate = jest.fn();

    await render(<CreateTabButton onPress={onCreate} accessibilityLabel="Create" />);
    await fireEvent.press(screen.getByRole("button", { name: "Create" }));

    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("dispatches long press and suppresses its follow-up tap", async () => {
    const onCreate = jest.fn();
    const onLongPress = jest.fn();

    await render(
      <CreateTabButton onPress={onCreate} onLongPress={onLongPress} accessibilityLabel="Create" />,
    );
    const button = screen.getByRole("button", { name: "Create" });

    await fireEvent(button, "longPress");
    await fireEvent.press(button);
    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onCreate).not.toHaveBeenCalled();

    await fireEvent(button, "pressOut");
    await fireEvent.press(button);
    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
