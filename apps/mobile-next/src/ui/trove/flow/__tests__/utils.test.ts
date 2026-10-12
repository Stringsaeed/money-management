import {
  actionBarLayout,
  chipPadding,
  chipRingWidth,
  kindThumbLayout,
  labelWithMeta,
  stepSegments,
} from "../utils";

describe("kindThumbLayout", () => {
  it("is empty until the track is measured", () => {
    expect(kindThumbLayout(0, 3, 1)).toEqual({ x: 0, width: 0 });
  });

  it("splits the track inside the 4pt inset and 4pt gaps", () => {
    // 350 - 2*4 inset - 2*4 gaps = 334 / 3 tabs
    const { x, width } = kindThumbLayout(350, 3, 2);
    expect(width).toBeCloseTo(334 / 3);
    expect(x).toBeCloseTo(2 * (334 / 3 + 4));
  });
});

describe("stepSegments", () => {
  it("marks the first `step` segments done", () => {
    expect(stepSegments(2, 3)).toEqual([true, true, false]);
  });

  it("clamps out-of-range steps", () => {
    expect(stepSegments(5, 3)).toEqual([true, true, true]);
    expect(stepSegments(-1, 2)).toEqual([false, false]);
  });
});

describe("chipPadding", () => {
  it("keeps the label 14pt from the outer edge across a 1pt ring", () => {
    expect(chipPadding("check", "md", false, false)).toEqual({ paddingLeft: 13, paddingRight: 13 });
  });

  it("gives back the thicker 1.5pt ring of a ticked chip", () => {
    expect(chipRingWidth("check", true)).toBe(1.5);
    expect(chipPadding("check", "md", true, true)).toEqual({
      paddingLeft: 8.5,
      paddingRight: 12.5,
    });
  });

  it("pads payday chips 16pt", () => {
    expect(chipPadding("solid", "lg", false, true)).toEqual({ paddingLeft: 15, paddingRight: 15 });
  });

  it("keeps the add chip's padding inside its real dashed border", () => {
    expect(chipPadding("add", "md", true, false)).toEqual({ paddingLeft: 14, paddingRight: 14 });
  });
});

describe("labelWithMeta", () => {
  it("adds the meta only when there is one", () => {
    expect(labelWithMeta("Dining", "148")).toBe("Dining, 148");
    expect(labelWithMeta("Dining")).toBe("Dining");
  });
});

describe("actionBarLayout", () => {
  it("stacks a caption over the primary", () => {
    expect(actionBarLayout({ caption: "Only money you have.", secondary: {} })).toBe("caption");
  });

  it("pairs a second button, outlined unless asked for text", () => {
    expect(actionBarLayout({ secondary: {} })).toBe("outline");
    expect(actionBarLayout({ secondary: { appearance: "text" } })).toBe("text");
  });

  it("puts a left slot beside the primary otherwise", () => {
    expect(actionBarLayout({})).toBe("row");
  });
});
