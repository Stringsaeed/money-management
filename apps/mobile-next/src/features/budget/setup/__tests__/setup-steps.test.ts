import { stepHeaderProps } from "../setup-steps";

describe("setup step header", () => {
  it("fills a segment per step and tags the household's first step", () => {
    expect(stepHeaderProps("payday", false)).toEqual({ step: 1, of: 3, tag: "1 / 3" });
    expect(stepHeaderProps("payday", true)).toEqual({ step: 1, of: 3, tag: "🏠 1 / 3" });
    expect(stepHeaderProps("amounts", true)).toEqual({ step: 3, of: 3, tag: "3 / 3" });
    expect(stepHeaderProps("review", false)).toEqual({ tag: "REVIEW" });
  });
});
