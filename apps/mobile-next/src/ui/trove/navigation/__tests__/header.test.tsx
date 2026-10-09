import { fireEvent, render, screen } from "@testing-library/react-native";

import { Header } from "../header";

describe("Header", () => {
  it("renders a large title with labelled actions", async () => {
    const onSearch = jest.fn();
    await render(
      <Header
        actions={[{ icon: "search", label: "Search", onPress: onSearch }]}
        title="Activity"
      />,
    );
    expect(screen.getByRole("header", { name: "Activity" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Search" }));
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("shows a back button in the compact bar only when given a handler", async () => {
    const onBack = jest.fn();
    const { rerender } = await render(<Header title="Groceries" variant="compact" />);
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
    await rerender(<Header onBack={onBack} title="Groceries" variant="compact" />);
    await fireEvent.press(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
