import { fireEvent, render, screen } from "@testing-library/react-native";

import { segmentLayout } from "../utils";
import { SegmentedControl } from "../segmented-control";

const OPTIONS = [
  { value: "1w", label: "1W" },
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
] as const;

describe("SegmentedControl", () => {
  it("marks only the current value as checked", async () => {
    await render(<SegmentedControl onChange={jest.fn()} options={OPTIONS} value="1m" />);
    expect(screen.getByRole("radio", { name: "1M" }).props.accessibilityState).toMatchObject({
      checked: true,
    });
    expect(screen.getByRole("radio", { name: "1W" }).props.accessibilityState).toMatchObject({
      checked: false,
    });
  });

  it("reports the pressed segment", async () => {
    const onChange = jest.fn();
    await render(<SegmentedControl onChange={onChange} options={OPTIONS} value="1m" />);
    await fireEvent.press(screen.getByRole("radio", { name: "3M" }));
    expect(onChange).toHaveBeenCalledWith("3m");
  });
});

describe("segmentLayout", () => {
  it("is empty until the track is measured", () => {
    expect(segmentLayout(0, 3, 1)).toEqual({ x: 0, width: 0 });
  });

  it("places the thumb on equal segments inside the 2pt padding and gap", () => {
    // 300 - 2*2 padding - 2*2 gaps = 292 / 3 segments
    const { x, width } = segmentLayout(300, 3, 2);
    expect(width).toBeCloseTo(292 / 3);
    expect(x).toBeCloseTo(2 * (292 / 3 + 2));
  });
});
