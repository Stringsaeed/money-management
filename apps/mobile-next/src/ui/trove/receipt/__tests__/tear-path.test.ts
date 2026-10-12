import { tearPath } from "../tear-path";

describe("tearPath", () => {
  it("matches the board's 350pt zigzag", () => {
    let board = "M0 0H350V0";
    for (let x = 350; x > 0; x -= 10) board += `L${x - 5} 10L${x - 10} 0`;
    expect(tearPath(350, 10)).toBe(`${board}Z`);
  });

  it("keeps 10pt teeth from the right edge at any width", () => {
    const path = tearPath(25.5, 8);
    expect(path.startsWith("M0 0H25.5V0L20.5 8L15.5 0L10.5 8L5.5 0L0.5 8L-4.5 0")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
  });

  it("rounds fractional widths to two decimals", () => {
    expect(tearPath(170.333333, 8)).toContain("H170.33V0L165.33 8L160.33 0");
  });
});
