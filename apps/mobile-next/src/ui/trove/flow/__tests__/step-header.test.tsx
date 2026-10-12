import { fireEvent, render, screen } from "@testing-library/react-native";

import { iconPath } from "../../icon/icon-paths";
import { StepHeader } from "../step-header";

describe("StepHeader", () => {
  it("shows a back button, a progress bar and the step tag", async () => {
    const onLeading = jest.fn();
    await render(<StepHeader leading="back" of={3} onLeading={onLeading} step={2} tag="2 / 3" />);

    await fireEvent.press(screen.getByRole("button", { name: "Back" }));
    expect(onLeading).toHaveBeenCalledTimes(1);

    const progress = screen.getByRole("progressbar", { name: "Step 2 of 3" });
    expect(progress.props.accessibilityValue).toEqual({ min: 0, max: 3, now: 2 });
    expect(screen.getByText("2 / 3")).toBeTruthy();
  });

  it("uses a close cross and a custom progress label", async () => {
    await render(
      <StepHeader
        accessibilityLabel="Payday step 1 of 3"
        leading="close"
        of={3}
        onLeading={jest.fn()}
        step={1}
        tag="WRAP-UP"
      />,
    );
    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Payday step 1 of 3" })).toBeTruthy();
    expect(JSON.stringify(screen.toJSON())).toContain(iconPath("close", false));
  });

  it("drops the progress bar without steps (review)", async () => {
    await render(<StepHeader leading="back" onLeading={jest.fn()} tag="REVIEW" />);
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.getByText("REVIEW")).toBeTruthy();
  });
});
