import { fireEvent, render, screen } from "@testing-library/react-native";

import { KindSwitch } from "../kind-switch";

const KINDS = [
  { value: "spent", label: "Spent", emoji: "💸" },
  { value: "refund", label: "Money back", emoji: "↩️" },
  { value: "income", label: "Got paid", emoji: "💰" },
] as const;

describe("KindSwitch", () => {
  it("is a tab list with only the current kind selected", async () => {
    await render(
      <KindSwitch accessibilityLabel="Kind" onChange={jest.fn()} options={KINDS} value="spent" />,
    );
    // The track groups the tabs without becoming one focusable element itself.
    expect(screen.getByLabelText("Kind").props.accessibilityRole).toBe("tablist");
    expect(screen.getByRole("tab", { name: "Spent" }).props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByRole("tab", { name: "Money back" }).props.accessibilityState).toMatchObject({
      selected: false,
    });
  });

  it("reports the pressed kind", async () => {
    const onChange = jest.fn();
    await render(<KindSwitch onChange={onChange} options={KINDS} value="spent" />);
    await fireEvent.press(screen.getByRole("tab", { name: "Got paid" }));
    expect(onChange).toHaveBeenCalledWith("income");
  });

  it("hides the emoji from screen readers", async () => {
    await render(<KindSwitch onChange={jest.fn()} options={KINDS} value="spent" />);
    expect(screen.queryByText("💸")).toBeNull();
    expect(screen.getByText("💸", { includeHiddenElements: true })).toBeTruthy();
  });
});
