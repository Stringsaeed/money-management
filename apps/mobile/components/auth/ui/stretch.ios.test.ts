import { stretchHorizontal } from "./stretch.ios";

describe("stretchHorizontal", () => {
  it("never emits Infinity (JSON turns it into null on the native bridge)", () => {
    const modifiers = stretchHorizontal(40);
    for (const modifier of modifiers) {
      expect(JSON.stringify(modifier)).not.toMatch(/"maxWidth":null/);
      expect(modifier).not.toMatchObject({ maxWidth: Infinity });
    }
    expect(modifiers.map((modifier) => modifier.$type)).toEqual([
      "containerRelativeFrame",
      "frame",
    ]);
  });
});
