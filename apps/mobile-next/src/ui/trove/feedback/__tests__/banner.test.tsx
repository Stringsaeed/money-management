import { fireEvent, render, screen } from "@testing-library/react-native";

import { Banner } from "../banner";

describe("Banner", () => {
  it("shows title and message", async () => {
    await render(
      <Banner message="$14 left with 21 days to go." title="Dining out is at 94%" tone="warning" />,
    );
    expect(screen.getByText("Dining out is at 94%")).toBeTruthy();
    expect(screen.getByText("$14 left with 21 days to go.")).toBeTruthy();
  });

  it("runs its action", async () => {
    const onAction = jest.fn();
    await render(
      <Banner
        actionLabel="Reconnect"
        onAction={onAction}
        title="Bank sync stopped"
        tone="negative"
      />,
    );
    await fireEvent.press(screen.getByRole("button", { name: "Reconnect" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("omits the action button without a handler", async () => {
    await render(<Banner actionLabel="Reconnect" message="Info" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders the positive tone", async () => {
    await render(
      <Banner message="Dining out is at 82%." title="Back under budget" tone="positive" />,
    );
    expect(screen.getByTestId("banner-positive")).toBeTruthy();
    expect(screen.getByText("Back under budget")).toBeTruthy();
  });

  it("defaults to neutral", async () => {
    await render(<Banner message="Rates update every 15 minutes." />);
    expect(screen.getByTestId("banner-neutral")).toBeTruthy();
  });
});
