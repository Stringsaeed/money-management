import { fieldBoxStyle } from "./recipe-core";
import { AUTH_FALLBACK_PALETTE } from "./tokens";

describe("fieldBoxStyle", () => {
  it("pairs borderWidth with borderColor so transformStyle keeps the stroke", () => {
    const style = fieldBoxStyle(AUTH_FALLBACK_PALETTE.light);
    expect(style.borderWidth).toBe(1);
    expect(style.borderColor).toBe(AUTH_FALLBACK_PALETTE.light["--color-input"]);
  });
});
