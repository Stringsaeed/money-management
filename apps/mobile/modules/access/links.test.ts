import { describe, expect, it } from "@jest/globals";

import {
  isAuthCarrierPath,
  parseAuthLink,
  parseAuthLinkFailure,
  parseAuthVerifyError,
} from "./links";

describe("parseAuthLink", () => {
  it("parses https, trove, and Expo-stripped magic-link tokens", () => {
    expect(parseAuthLink("https://auth.trove.ing/l/magic?token=abc")).toEqual({
      kind: "sign_in_token",
      token: "abc",
    });
    expect(parseAuthLink("trove://l/magic?token=abc")).toEqual({
      kind: "sign_in_token",
      token: "abc",
    });
    expect(parseAuthLink("l/magic?token=abc")).toEqual({
      kind: "sign_in_token",
      token: "abc",
    });
    expect(parseAuthLink("/l/magic?token=abc")).toEqual({
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

  it("treats trusted error redirects as unusable", () => {
    expect(parseAuthLinkFailure("https://auth.trove.ing/l/magic?error=INVALID_TOKEN")).toBe(
      "unusable",
    );
    expect(parseAuthLinkFailure("l/magic?error=INVALID_TOKEN")).toBe("unusable");
    expect(parseAuthLinkFailure("https://evil.example/l/magic?error=INVALID_TOKEN")).toBeNull();
  });

  it("reads verify redirect errors from the auth host root", () => {
    expect(parseAuthVerifyError("https://auth.trove.ing/?error=new_user_signup_disabled")).toBe(
      "new_user_signup_disabled",
    );
    expect(parseAuthVerifyError("https://auth.trove.ing/?error=INVALID_TOKEN")).toBe(
      "INVALID_TOKEN",
    );
    expect(parseAuthVerifyError("https://evil.example/?error=new_user_signup_disabled")).toBeNull();
  });
});

describe("isAuthCarrierPath", () => {
  it("recognizes absolute and Expo-extracted auth carriers", () => {
    expect(isAuthCarrierPath("trove://l/magic?token=abc")).toBe(true);
    expect(isAuthCarrierPath("https://auth.trove.ing/l/reset?token=xyz")).toBe(true);
    expect(isAuthCarrierPath("l/magic?token=abc")).toBe(true);
    expect(isAuthCarrierPath("/l/reset?token=xyz")).toBe(true);
    expect(isAuthCarrierPath("l/magic?error=INVALID_TOKEN")).toBe(true);
  });

  it("rejects unrelated and untrusted paths", () => {
    expect(isAuthCarrierPath("settings/household")).toBe(false);
    expect(isAuthCarrierPath("https://evil.example/l/magic?token=abc")).toBe(false);
    expect(isAuthCarrierPath("l/magic")).toBe(false);
  });
});
