import { describe, expect, it } from "@jest/globals";

import { failureCopy, noticeCopy } from "./copy";
import type { Notice } from "./types";

describe("auth journey copy", () => {
  it("directs an existing profile to sign in or reset the password", () => {
    expect(failureCopy({ kind: "account_exists" })).toBe(
      "This email already has a profile. Sign in or reset your password.",
    );
  });

  it("keeps invalid email feedback actionable", () => {
    expect(failureCopy({ kind: "invalid_email" })).toBe("Enter a valid email address.");
    expect(failureCopy({ kind: "invalid_input" })).toBe("Check the required fields and try again.");
  });

  it("suggests password recovery after rejected credentials", () => {
    expect(failureCopy({ kind: "bad_credentials" })).toBe(
      "That email and password didn't match. Try again or reset your password.",
    );
  });

  it("keeps magic-link delivery generic for account enumeration protection", () => {
    const notices: Notice[] = [
      { kind: "link_sent", operation: "sign_in", email: "known@example.com" },
      { kind: "link_sent", operation: "sign_in", email: "unknown@example.com" },
    ];

    expect(notices.map(noticeCopy)).toEqual([
      "Check your email for a link. Same note for any address. 📬",
      "Check your email for a link. Same note for any address. 📬",
    ]);
  });
});
