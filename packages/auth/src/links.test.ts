import { describe, expect, it } from "vitest";

import { buildEmailLink } from "./links";

describe("buildEmailLink", () => {
  it("builds token-only magic and reset URLs", () => {
    expect(buildEmailLink("magic", "abc", "https://auth.trove.ing")).toBe(
      "https://auth.trove.ing/l/magic?token=abc",
    );
    expect(buildEmailLink("reset", "xyz", "https://auth.trove.ing")).toBe(
      "https://auth.trove.ing/l/reset?token=xyz",
    );
  });

  it("strips a trailing slash on the origin", () => {
    expect(buildEmailLink("magic", "abc", "https://auth.trove.ing/")).toBe(
      "https://auth.trove.ing/l/magic?token=abc",
    );
  });

  it("encodes the token for the query string", () => {
    expect(buildEmailLink("magic", "a b/+", "https://auth.trove.ing")).toBe(
      "https://auth.trove.ing/l/magic?token=a%20b%2F%2B",
    );
  });
});
