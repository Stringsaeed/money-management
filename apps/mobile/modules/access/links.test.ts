import { describe, expect, it } from "@jest/globals";

import { parseAuthLink } from "./links";

describe("parseAuthLink", () => {
  it("parses https and trove magic-link tokens", () => {
    expect(parseAuthLink("https://auth.trove.ing/l/magic?token=abc")).toEqual({
      kind: "sign_in_token",
      token: "abc",
    });
    expect(parseAuthLink("trove://l/magic?token=abc")).toEqual({
      kind: "sign_in_token",
      token: "abc",
    });
  });

  it("parses https and trove reset tokens", () => {
    expect(parseAuthLink("https://auth.trove.ing/l/reset?token=xyz")).toEqual({
      kind: "reset_token",
      token: "xyz",
    });
    expect(parseAuthLink("trove://l/reset?token=xyz")).toEqual({
      kind: "reset_token",
      token: "xyz",
    });
  });

  it("rejects a look-alike authority", () => {
    expect(parseAuthLink("https://auth.trove.ing.evil.com/l/magic?token=abc")).toBeNull();
    expect(parseAuthLink("https://evil.example/l/magic?token=abc")).toBeNull();
  });

  it("rejects missing tokens and unknown paths", () => {
    expect(parseAuthLink("https://auth.trove.ing/l/magic")).toBeNull();
    expect(parseAuthLink("https://auth.trove.ing/auth/callback?token=abc")).toBeNull();
    expect(parseAuthLink("not-a-url")).toBeNull();
  });

  it("never returns a session_cookie grant even when cookie is present", () => {
    const grant = parseAuthLink("https://auth.trove.ing/l/magic?token=abc&cookie=session-material");
    expect(grant).toEqual({ kind: "sign_in_token", token: "abc" });
    expect(grant).not.toMatchObject({ kind: "session_cookie" });
  });
});
