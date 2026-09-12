import { describe, expect, it } from "@jest/globals";

import { accessFingerprint } from "./banner-fingerprint";

describe("accessFingerprint", () => {
  it("locks the session-revoked access fingerprint", () => {
    expect(accessFingerprint("session_revoked")).toBe("session_revoked");
  });
});
