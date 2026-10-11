import { fireEvent, render, screen } from "@testing-library/react-native";

import { EmptyState } from "../empty-state";

describe("EmptyState", () => {
  it("renders copy and runs the primary action", async () => {
    const onAction = jest.fn();
    await render(
      <EmptyState
        actionLabel="Create a pot"
        icon="savings"
        message="Set money aside for something specific."
        onAction={onAction}
        title="No pots yet"
      />,
    );
    expect(screen.getByRole("header", { name: "No pots yet" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Create a pot" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("has no button without an action", async () => {
    await render(<EmptyState title="Nothing here" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
