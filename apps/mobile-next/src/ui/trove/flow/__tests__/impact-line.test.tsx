import { render, screen } from "@testing-library/react-native";

import { ImpactLine } from "../impact-line";

describe("ImpactLine", () => {
  it("announces the projection politely without reading the glyph", async () => {
    await render(<ImpactLine text="Dining & coffee will be AED 175 over" tone="over" />);
    const line = screen.getByLabelText("Dining & coffee will be AED 175 over");
    expect(line.props.accessibilityLiveRegion).toBe("polite");
    expect(screen.getByText("⚠︎", { includeHiddenElements: true })).toBeTruthy();
  });

  it("uses a tick for an entry that fits, or a custom glyph", async () => {
    await render(<ImpactLine text="Dining & coffee: AED 63 left after this" tone="ok" />);
    expect(screen.getByText("✓", { includeHiddenElements: true })).toBeTruthy();
    await render(<ImpactLine glyph="★" text="Nice" tone="ok" />);
    expect(screen.getByText("★", { includeHiddenElements: true })).toBeTruthy();
  });
});
