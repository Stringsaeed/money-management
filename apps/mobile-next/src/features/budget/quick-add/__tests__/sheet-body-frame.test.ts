import { sheetBodyFrame } from "../sheet-body-frame";

describe("sheetBodyFrame", () => {
  it("fills a 390x844 iPhone's full-height sheet and lands on the board's paddings", () => {
    expect(sheetBodyFrame(844, { top: 47, bottom: 34 })).toEqual({
      minHeight: 755,
      paddingTop: 12,
      paddingBottom: 10,
    });
  });

  it("keeps the board's bottom space on a phone with no home indicator", () => {
    expect(sheetBodyFrame(667, { top: 20, bottom: 0 }).paddingBottom).toBe(10);
  });
});
