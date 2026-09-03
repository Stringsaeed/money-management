import { describe, expect, it } from "vitest";

import {
  AUTH_PUBLIC_URL,
  emailFromMagicVerificationValue,
  isPriorMagicVerification,
  isPriorResetVerification,
  LINK_TTL_SECONDS,
} from "./link-policy";

const priorMagic = {
  id: "v-1",
  identifier: "old-token",
  value: JSON.stringify({ email: "Ada@Trove.ing", name: "Ada" }),
};

describe("link policy", () => {
  it("uses a 15 minute TTL and the auth.trove.ing public URL", () => {
    expect(LINK_TTL_SECONDS).toBe(15 * 60);
    expect(AUTH_PUBLIC_URL).toBe("https://auth.trove.ing");
  });

  it("reads the email from a magic-link verification value", () => {
    expect(emailFromMagicVerificationValue(priorMagic.value)).toBe("ada@trove.ing");
    expect(emailFromMagicVerificationValue("not-json")).toBeNull();
    expect(emailFromMagicVerificationValue(JSON.stringify({ name: "Ada" }))).toBeNull();
  });

  it("invalidates prior magic rows for the same email and keeps the new token", () => {
    expect(isPriorMagicVerification(priorMagic, "ada@trove.ing", "new-token")).toBe(true);
    expect(isPriorMagicVerification(priorMagic, "ada@trove.ing", "old-token")).toBe(false);
    expect(isPriorMagicVerification(priorMagic, "other@trove.ing", "new-token")).toBe(false);
  });

  it("invalidates prior reset rows for the same user and keeps the new token", () => {
    const priorReset = {
      id: "v-2",
      identifier: "reset-password:old-token",
      value: "user-1",
    };
    expect(isPriorResetVerification(priorReset, "user-1", "reset-password:new-token")).toBe(true);
    expect(isPriorResetVerification(priorReset, "user-1", "reset-password:old-token")).toBe(false);
    expect(isPriorResetVerification(priorReset, "user-2", "reset-password:new-token")).toBe(false);
    expect(
      isPriorResetVerification(
        { id: "v-3", identifier: "unrelated", value: "user-1" },
        "user-1",
        "reset-password:new-token",
      ),
    ).toBe(false);
  });
});
