import {
  average,
  barHeights,
  buildAreaPath,
  buildLinePath,
  cellIndexFromX,
  columnDomainMax,
  columnLayout,
  deltaDirection,
  deltaTone,
  foldCategories,
  formatDay,
  formatMoney,
  formatShare,
  gridValues,
  linearScale,
  niceStep,
  percentChange,
  presentDelta,
  placeTooltip,
  pointIndexFromX,
  type CategoryAmount,
} from "../utils";

describe("scales", () => {
  it("picks a 1/2/5 step that keeps the grid to at most three lines", () => {
    expect(niceStep(241, 3)).toBe(100);
    expect(niceStep(2000, 3)).toBe(1000);
    expect(niceStep(9, 3)).toBe(5);
    expect(niceStep(0, 3, 100)).toBe(100);
  });

  it("lists gridlines strictly above the minimum", () => {
    expect(gridValues(0, 241)).toEqual([100, 200]);
    expect(gridValues(10_800, 12_800)).toEqual([11_000, 12_000]);
    expect(gridValues(5, 5)).toEqual([]);
  });

  it("gives columns 15% headroom over the tallest value", () => {
    expect(columnDomainMax([42, 210, 76])).toBeCloseTo(241.5);
    expect(columnDomainMax([0, 0], 100)).toBe(100);
  });

  it("maps a domain onto a range, centring a degenerate domain", () => {
    const scale = linearScale([0, 10], [100, 0]);
    expect(scale(0)).toBe(100);
    expect(scale(5)).toBe(50);
    expect(linearScale([3, 3], [0, 10])(3)).toBe(5);
  });
});

describe("columns", () => {
  it("scales heights to the plot and draws nothing for zero or negative values", () => {
    expect(barHeights([0, 100, 200, -5, Number.NaN], 140, 200)).toEqual([0, 70, 140, 0, 0]);
    expect(barHeights([50], 140, 0)).toEqual([0]);
  });

  it("caps bar width at 24pt and centres bars in their cells", () => {
    const wide = columnLayout(14, 800);
    expect(wide.barWidth).toBe(24);
    const narrow = columnLayout(14, 322);
    expect(narrow.cellWidth).toBeCloseTo(23);
    expect(narrow.barWidth).toBe(14);
    expect(narrow.centerX(0)).toBeCloseTo(11.5);
    expect(narrow.centerX(13)).toBeCloseTo(310.5);
  });

  it("averages, treating no data as zero", () => {
    expect(average([10, 20, 30])).toBe(20);
    expect(average([])).toBe(0);
  });
});

describe("paths", () => {
  it("builds an M/L line path", () => {
    expect(
      buildLinePath([
        { x: 0, y: 10 },
        { x: 5.04, y: 4.26 },
      ]),
    ).toBe("M0 10 L5 4.3");
  });

  it("closes the area down to the baseline", () => {
    const points = [
      { x: 0, y: 10 },
      { x: 20, y: 4 },
    ];
    expect(buildAreaPath(points, 50)).toBe("M0 10 L20 4 L20 50 L0 50 Z");
    expect(buildAreaPath([], 50)).toBe("");
  });
});

describe("scrubbing", () => {
  it("finds the column under the finger and clamps outside the plot", () => {
    expect(cellIndexFromX(0, 0, 280, 14)).toBe(0);
    expect(cellIndexFromX(139, 0, 280, 14)).toBe(6);
    expect(cellIndexFromX(140, 0, 280, 14)).toBe(7);
    expect(cellIndexFromX(-30, 0, 280, 14)).toBe(0);
    expect(cellIndexFromX(900, 0, 280, 14)).toBe(13);
  });

  it("snaps to the nearest line point", () => {
    expect(pointIndexFromX(6, 6, 300, 30)).toBe(0);
    expect(pointIndexFromX(306, 6, 300, 30)).toBe(29);
    expect(pointIndexFromX(151, 6, 300, 30)).toBe(14);
    expect(pointIndexFromX(1000, 6, 300, 30)).toBe(29);
    expect(pointIndexFromX(50, 6, 300, 1)).toBe(0);
  });

  it("keeps tooltips inside the container and above their anchor", () => {
    const size = { width: 100, height: 28 };
    expect(placeTooltip(10, 80, size, 300)).toEqual({ left: 0, top: 42 });
    expect(placeTooltip(295, 80, size, 300)).toEqual({ left: 200, top: 42 });
    expect(placeTooltip(150, 5, size, 300)).toEqual({ left: 100, top: 0 });
    expect(placeTooltip(150, null, size, 300)).toEqual({ left: 100, top: 0 });
  });
});

describe("formatting", () => {
  it("prints whole or exact money with the typographic minus", () => {
    expect(formatMoney(128_400, "USD", false)).toBe("$1,284");
    expect(formatMoney(5_571, "USD", false)).toBe("$56");
    expect(formatMoney(7_600, "USD")).toBe("$76.00");
    expect(formatMoney(-1_250, "USD")).toBe("−$12.50");
    expect(formatMoney(18_430, "JPY", false)).toBe("¥18,430");
  });

  it("falls back to the ISO code where the sign is a glyph", () => {
    expect(formatMoney(6_420, "AED")).toBe("AED 64.20");
  });

  it("formats shares and days", () => {
    expect(formatShare(0.3271)).toBe("32.7%");
    expect(formatDay("2026-10-09")).toBe("Oct 9");
  });
});

describe("change", () => {
  it("measures percent change and refuses an empty base", () => {
    expect(percentChange(92, 100)).toBeCloseTo(-8);
    expect(percentChange(5, 0)).toBeNull();
  });

  it("colors by meaning: less spending is positive, more is negative", () => {
    expect(deltaDirection(-8)).toBe("down");
    expect(deltaTone(-8)).toBe("positive");
    expect(deltaTone(8)).toBe("negative");
    expect(deltaTone(-8, false)).toBe("negative");
    expect(deltaTone(0.2)).toBe("neutral");
  });
});

describe("presentDelta", () => {
  it("builds the pill and the spoken phrase", () => {
    expect(presentDelta(-8.2, "vs Sep", true)).toEqual({
      direction: "down",
      tone: "positive",
      label: "8% vs Sep",
      spoken: "down 8% vs Sep",
    });
    expect(presentDelta(0.1, "", true)).toMatchObject({
      direction: "flat",
      spoken: "unchanged 0%",
    });
    expect(presentDelta(undefined, "vs Sep", true)).toBeNull();
  });
});

const cat = (id: string, minor: number, extra: Partial<CategoryAmount> = {}): CategoryAmount => ({
  id,
  name: id,
  minor,
  ...extra,
});

describe("foldCategories", () => {
  it("returns nothing when there is nothing to show", () => {
    expect(foldCategories([])).toEqual([]);
    expect(foldCategories([cat("a", 0), cat("b", -5)])).toEqual([]);
  });

  it("keeps pinned colors and orders slices by color slot, not amount", () => {
    const slices = foldCategories([
      cat("rent", 31_000, { colorKey: "bills" }),
      cat("food", 42_000, { colorKey: "groceries" }),
      cat("bus", 18_200, { colorKey: "transport" }),
    ]);
    expect(slices.map((slice) => slice.colorKey)).toEqual(["groceries", "transport", "bills"]);
    expect(slices.reduce((sum, slice) => sum + slice.share, 0)).toBeCloseTo(1);
  });

  it("gives unpinned categories the next free slot in ranked order", () => {
    const slices = foldCategories([
      cat("a", 300),
      cat("b", 200, { colorKey: "groceries" }),
      cat("c", 100),
    ]);
    expect(slices.map((slice) => [slice.id, slice.colorKey])).toEqual([
      ["b", "groceries"],
      ["a", "dining"],
      ["c", "transport"],
    ]);
  });

  it("folds everything past six into Other, together with an existing Other", () => {
    const items = [
      ...["a", "b", "c", "d", "e", "f"].map((id, index) => cat(id, 1_000 - index * 100)),
      cat("g", 50),
      cat("h", 40),
      cat("misc", 10, { colorKey: "other" }),
    ];
    const slices = foldCategories(items);
    expect(slices).toHaveLength(7);
    const other = slices[6];
    expect(other).toMatchObject({ id: "other", name: "Other", colorKey: "other", minor: 100 });
    expect(slices.slice(0, 6).map((slice) => slice.id)).toEqual(["a", "b", "c", "d", "e", "f"]);
  });

  it("honors a smaller maxVisible", () => {
    const slices = foldCategories([cat("a", 300), cat("b", 200), cat("c", 100)], 2);
    expect(slices.map((slice) => slice.id)).toEqual(["a", "b", "other"]);
    expect(slices[2]?.minor).toBe(100);
  });
});
