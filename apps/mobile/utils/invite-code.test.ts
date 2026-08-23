import { describe, expect, it } from "@jest/globals";

import {
  INVITE_CODE_LENGTH,
  formatInviteExpiry,
  isValidInviteCodeFormat,
  normalizeInviteCode,
} from "./invite-code";

describe("normalizeInviteCode", () => {
  it("trims whitespace and uppercases", () => {
    expect(normalizeInviteCode("  abcd2345 ")).toBe("ABCD2345");
  });

  it("leaves already-normalized codes untouched", () => {
    expect(normalizeInviteCode("ABCD2345")).toBe("ABCD2345");
  });
});

describe("isValidInviteCodeFormat", () => {
  it("accepts a well-formed code", () => {
    expect(isValidInviteCodeFormat("ABCD2345")).toBe(true);
    expect(isValidInviteCodeFormat("HJKMNPQR")).toBe(true);
  });

  it("rejects ambiguous characters excluded from the alphabet", () => {
    expect(isValidInviteCodeFormat("ABC01234")).toBe(false);
    expect(isValidInviteCodeFormat("ABCI1234")).toBe(false);
    expect(isValidInviteCodeFormat("ABCL1234")).toBe(false);
    expect(isValidInviteCodeFormat("ABCO1234")).toBe(false);
  });

  it("rejects wrong lengths and lowercase input", () => {
    expect(isValidInviteCodeFormat("ABC")).toBe(false);
    expect(isValidInviteCodeFormat(`${"A".repeat(INVITE_CODE_LENGTH + 1)}`)).toBe(false);
    expect(isValidInviteCodeFormat("abcd2345")).toBe(false);
  });
});

describe("formatInviteExpiry", () => {
  const now = new Date("2026-08-22T12:00:00Z");

  it("reports expired codes", () => {
    expect(formatInviteExpiry(new Date("2026-08-20T00:00:00Z"), now)).toBe("Expired");
  });

  it("reports same-day expiry as today", () => {
    expect(formatInviteExpiry(new Date("2026-08-22T18:00:00Z"), now)).toBe("Expires today");
  });

  it("counts remaining whole days up", () => {
    expect(formatInviteExpiry(new Date("2026-08-29T12:00:00Z"), now)).toBe("Expires in 7 days");
  });
});
