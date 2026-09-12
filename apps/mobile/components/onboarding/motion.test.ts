import { describe, expect, it } from "@jest/globals";

import { STAGGER_MS } from "./motion";

describe("STAGGER_MS", () => {
  it("locks staggered sibling delay to 55ms", () => {
    expect(STAGGER_MS).toBe(55);
  });
});
