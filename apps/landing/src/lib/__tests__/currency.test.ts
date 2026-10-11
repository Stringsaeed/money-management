import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  currencyFor,
  currencyLineup,
  DEFAULT_CURRENCY,
  FALLBACK_CURRENCY,
  formatAmount,
  pickCurrency,
  signHeight,
  withCode,
} from "../currency.ts";

describe("pickCurrency", () => {
  it("maps the launch markets to their own currency", () => {
    assert.equal(pickCurrency(null, "AE"), "AED");
    assert.equal(pickCurrency(null, "SA"), "SAR");
    assert.equal(pickCurrency(null, "EG"), "EGP");
    assert.equal(pickCurrency(null, "US"), "USD");
  });

  it("covers the rest of the app's currency list", () => {
    assert.equal(pickCurrency(null, "DE"), "EUR");
    assert.equal(pickCurrency(null, "IE"), "EUR");
    assert.equal(pickCurrency(null, "GB"), "GBP");
    assert.equal(pickCurrency(null, "KW"), "KWD");
    assert.equal(pickCurrency(null, "JP"), "JPY");
    assert.equal(pickCurrency(null, "LI"), "CHF");
  });

  it("falls back to dollars for countries without their own entry", () => {
    assert.equal(pickCurrency(null, "BR"), FALLBACK_CURRENCY);
  });

  it("keeps the designed dirham page when the country is unknown", () => {
    assert.equal(pickCurrency(null, null), DEFAULT_CURRENCY);
  });

  it("lets an explicit override win, case-insensitively, and ignores junk", () => {
    assert.equal(pickCurrency("sar", "US"), "SAR");
    assert.equal(pickCurrency("XYZ", "EG"), "EGP");
  });
});

describe("formatting", () => {
  it("pads to each currency's minor digits", () => {
    assert.equal(formatAmount(1988, currencyFor("AED"), true), "1,988.00");
    assert.equal(formatAmount(1988, currencyFor("JPY"), true), "1,988");
    assert.equal(formatAmount(1988, currencyFor("KWD"), true), "1,988.000");
  });

  it("prints receipts with the ISO code and a true minus sign", () => {
    assert.equal(withCode(1988, currencyFor("USD")), "USD 1,988");
    assert.equal(withCode(-64.2, currencyFor("AED"), true), "−AED 64.20");
  });

  it("draws dirham and riyal, and sets the rest as text", () => {
    assert.deepEqual(currencyFor("AED").sign, { drawn: "dirham" });
    assert.deepEqual(currencyFor("SAR").sign, { drawn: "riyal" });
    assert.deepEqual(currencyFor("USD").sign, { text: "$" });
    assert.deepEqual(currencyFor("EGP").sign, { text: "E£" });
  });

  it("leads the line-up with the visitor's currency", () => {
    const codes = (code: "AED" | "USD") => currencyLineup(currencyFor(code)).map((c) => c.code);
    assert.deepEqual(codes("AED"), ["AED", "SAR", "EUR", "GBP", "JPY"]);
    assert.deepEqual(codes("USD"), ["USD", "AED", "SAR", "EUR", "GBP"]);
  });

  it("sizes drawn signs to the canvas and text signs to their cap height", () => {
    assert.equal(signHeight(currencyFor("SAR")), "0.72em");
    assert.equal(signHeight(currencyFor("EUR")), "0.698em");
  });
});
