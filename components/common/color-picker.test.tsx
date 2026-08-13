import { fireEvent, render, screen } from "@testing-library/react-native";

import { ColorPalette } from "@/constants/theme";
import { ColorPicker } from "@/components/common/color-picker";

describe("ColorPicker", () => {
  it("renders the palette and reports the pressed color", async () => {
    const onChange = jest.fn();

    await render(<ColorPicker value={ColorPalette[0]!} onChange={onChange} />);

    await fireEvent.press(screen.getAllByRole("button")[1]!);

    expect(onChange).toHaveBeenCalledWith(ColorPalette[1]);
  });

  it("marks the selected color with a check indicator", async () => {
    await render(<ColorPicker value={ColorPalette[0]!} onChange={jest.fn()} />);

    expect(screen.getAllByRole("button")[0]?.props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByTestId("selected-color-check")).toBeOnTheScreen();
  });
});
