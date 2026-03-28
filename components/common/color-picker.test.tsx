import { fireEvent, render, screen } from "@testing-library/react-native";

import { ColorPalette } from "@/constants/theme";
import { ColorPicker } from "@/components/common/color-picker";

describe("ColorPicker", () => {
  it("renders the palette and reports the pressed color", () => {
    const onChange = jest.fn();

    render(<ColorPicker value={ColorPalette[0]!} onChange={onChange} />);

    fireEvent.press(screen.getAllByRole("button")[1]!);

    expect(onChange).toHaveBeenCalledWith(ColorPalette[1]);
  });
});
