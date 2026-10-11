import { fireEvent, render, screen } from "@testing-library/react-native";

import { OptionTile } from "../option-tile";
import { OptionTileGrid } from "../option-tile-grid";

describe("OptionTile", () => {
  it("is a radio carrying its checked state", async () => {
    await render(
      <>
        <OptionTile emoji="🏦" name="Right" onPress={jest.fn()} selected />
        <OptionTile emoji="🐷" name="Main Savings" onPress={jest.fn()} selected={false} />
      </>,
    );
    expect(screen.getByRole("radio", { name: "Right" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Main Savings" })).not.toBeChecked();
  });

  it("includes the subtitle in the list label", async () => {
    await render(
      <OptionTile
        emoji="🏦"
        name="Right"
        onPress={jest.fn()}
        selected={false}
        subtitle="AED · 12,480.50"
      />,
    );
    expect(screen.getByRole("radio", { name: "Right, AED · 12,480.50" })).toBeTruthy();
    expect(screen.getByText("AED · 12,480.50")).toBeTruthy();
  });

  it("shows the check only on the selected list tile", async () => {
    await render(<OptionTile emoji="🐷" name="Off" onPress={jest.fn()} selected={false} />);
    expect(JSON.stringify(screen.toJSON())).not.toContain("RNSVGSvgView");
    await screen.rerender(<OptionTile emoji="🐷" name="Off" onPress={jest.fn()} selected />);
    expect(JSON.stringify(screen.toJSON())).toContain("RNSVGSvgView");
  });

  it("selects on press", async () => {
    const onPress = jest.fn();
    await render(<OptionTile emoji="☕" name="Coffee" onPress={onPress} selected={false} />);
    await fireEvent.press(screen.getByRole("radio", { name: "Coffee" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("grid tiles drop the subtitle", async () => {
    await render(
      <OptionTile
        emoji="🛒"
        layout="grid"
        name="Groceries"
        onPress={jest.fn()}
        selected
        subtitle="ignored"
      />,
    );
    expect(screen.queryByText("ignored")).toBeNull();
    expect(screen.getByRole("radio", { name: "Groceries" })).toBeChecked();
  });
});

describe("OptionTileGrid", () => {
  it("is a radio group holding every tile", async () => {
    await render(
      <OptionTileGrid accessibilityLabel="Category">
        {["A", "B", "C", "D"].map((name) => (
          <OptionTile
            emoji="🛒"
            key={name}
            layout="grid"
            name={name}
            onPress={jest.fn()}
            selected={name === "B"}
          />
        ))}
      </OptionTileGrid>,
    );
    expect(screen.getByLabelText("Category")).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.getByRole("radio", { name: "B" })).toBeChecked();
  });
});
