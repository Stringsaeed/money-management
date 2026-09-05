import { describe, expect, it } from "@jest/globals";

import { redirectSystemPath } from "../../app/+native-intent";

describe("redirectSystemPath", () => {
  it("suppresses auth carriers", () => {
    expect(redirectSystemPath({ path: "l/magic?token=abc", initial: true })).toBeNull();
    expect(
      redirectSystemPath({
        path: "https://auth.trove.ing/l/reset?token=xyz",
        initial: false,
      }),
    ).toBeNull();
  });

  it("preserves normal paths", () => {
    expect(redirectSystemPath({ path: "settings/household", initial: true })).toBe(
      "settings/household",
    );
  });
});
