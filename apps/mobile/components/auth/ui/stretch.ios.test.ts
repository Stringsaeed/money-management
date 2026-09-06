import { stretchHorizontal } from "./stretch.ios";

describe("stretchHorizontal", () => {
  it("emits frame modifiers for width stretch and optional height", () => {
    expect(stretchHorizontal().map((modifier) => modifier.$type)).toEqual(["frame"]);
    expect(stretchHorizontal(40).map((modifier) => modifier.$type)).toEqual(["frame", "frame"]);
  });
});
