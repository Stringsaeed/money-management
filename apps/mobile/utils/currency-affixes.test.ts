import { describe, expect, it } from "@jest/globals";

import { currencyAffixes } from "./currency";

describe("currencyAffixes", () => {
  it("splits USD and EUR currency formatting for en-US", () => {
    expect(currencyAffixes("USD", "en-US")).toEqual({ prefix: "$", suffix: "" });
    expect(currencyAffixes("EUR", "en-US")).toEqual({ prefix: "€", suffix: "" });
  });
});
