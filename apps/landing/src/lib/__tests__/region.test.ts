import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CURRENCY_CODES } from "../currency.ts";
import { regionFor } from "../region.ts";

const UAE_ONLY = /DEWA|Salik|\bdu\b|cheque|Carrefour/i;

describe("regionFor", () => {
  it("keeps the designed UAE words on the dirham page", () => {
    const uae = regionFor("AED");
    assert.equal(uae.utility, "DEWA");
    assert.equal(uae.phone, "du");
    assert.equal(uae.fuel, "Fuel & Salik");
    assert.equal(uae.rent.one, "Rent cheque");
  });

  it("never shows UAE-only words anywhere else", () => {
    for (const code of CURRENCY_CODES.filter((c) => c !== "AED")) {
      const words = JSON.stringify(regionFor(code));
      assert.doesNotMatch(words, UAE_ONLY, `${code} profile leaks a UAE term`);
    }
  });

  it("gives each Gulf market its own utility and network", () => {
    assert.deepEqual(
      (["SAR", "KWD", "QAR"] as const).map((code) => [
        regionFor(code).utility,
        regionFor(code).phone,
      ]),
      [
        ["SEC", "STC"],
        ["MEW", "Zain"],
        ["KAHRAMAA", "Ooredoo"],
      ],
    );
  });

  it("keeps remittance for Gulf expats and swaps it for a yearly bill elsewhere", () => {
    assert.equal(regionFor("SAR").monthlyLump.kind, "send-home");
    assert.equal(regionFor("USD").monthlyLump.kind, "yearly-bill");
    assert.equal(regionFor("EGP").monthlyLump.kind, "yearly-bill");
  });

  it("marks Ramadan where it is the season, and the holidays where it is not", () => {
    assert.equal(regionFor("EGP").season.name, "Ramadan & Eid");
    assert.equal(regionFor("GBP").season.name, "The holidays");
    assert.equal(regionFor("INR").season.name, "Diwali");
  });
});
