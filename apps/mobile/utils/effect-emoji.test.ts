import { describe, expect, it } from "@jest/globals";

import { effectEmoji } from "./activity";

describe("effectEmoji", () => {
  it("maps known tags and falls back for unknowns", () => {
    expect(effectEmoji("ledger")).toBe("🧾");
    expect(effectEmoji("members")).toBe("👥");
    expect(effectEmoji("mystery")).toBe("📝");
  });
});
