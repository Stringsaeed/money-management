import { describe, expect, it, vi } from "vitest";

import {
  AUTH_LINK_PATHS,
  TROVE_APP_IDENTITY,
  buildAppleAppSiteAssociation,
  buildAssetLinks,
  buildSchemeLink,
  parseCertFingerprints,
  parseOpenInAppRequest,
  renderOpenInAppPage,
  type AppIdentity,
} from "./app-association";

const VALID_FINGERPRINT =
  "aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99:aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99";
const VALID_NORMALIZED =
  "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99";
const OTHER_FINGERPRINT =
  "11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00";
const THIRTY_ONE_OCTETS =
  "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88";

const identity: AppIdentity = TROVE_APP_IDENTITY;

describe("TROVE_APP_IDENTITY", () => {
  it("matches the mobile bundle, team, and App Store id", () => {
    expect(identity.appleTeamId).toBe("V3HN8HXZYK");
    expect(identity.iosBundleId).toBe("com.stringsaeed.moneymanagement");
    expect(identity.androidPackage).toBe("com.stringsaeed.moneymanagement");
    expect(identity.appStoreId).toBe("6799272091");
  });
});

describe("buildAppleAppSiteAssociation", () => {
  it("emits modern applinks components and webcredentials for the Trove app id", () => {
    const aasa = buildAppleAppSiteAssociation(identity);
    const appId = "V3HN8HXZYK.com.stringsaeed.moneymanagement";

    expect(aasa.applinks.details).toHaveLength(1);
    expect(aasa.applinks.details[0]?.appIDs).toEqual([appId]);
    expect(aasa.applinks.details[0]?.components.map((component) => component["/"])).toEqual([
      "/l/magic",
      "/l/reset",
    ]);
    expect(AUTH_LINK_PATHS).toEqual(["/l/magic", "/l/reset"]);
    expect(aasa.webcredentials?.apps).toEqual([appId]);
  });
});

describe("parseCertFingerprints", () => {
  it("returns [] for undefined and empty input", () => {
    expect(parseCertFingerprints(undefined)).toEqual([]);
    expect(parseCertFingerprints("")).toEqual([]);
    expect(parseCertFingerprints("   ")).toEqual([]);
  });

  it("normalises case and accepts comma, whitespace, and newline separators", () => {
    const raw = `${VALID_FINGERPRINT}, ${OTHER_FINGERPRINT.toLowerCase()}\n${VALID_NORMALIZED}`;
    expect(parseCertFingerprints(raw)).toEqual([VALID_NORMALIZED, OTHER_FINGERPRINT]);
  });

  it("drops malformed entries and reports them", () => {
    const onReject = vi.fn();
    const result = parseCertFingerprints(
      `abc, ${VALID_FINGERPRINT}, ${THIRTY_ONE_OCTETS}, not-hex:ZZ`,
      onReject,
    );

    expect(result).toEqual([VALID_NORMALIZED]);
    expect(onReject).toHaveBeenCalledTimes(3);
    expect(onReject).toHaveBeenCalledWith("abc");
    expect(onReject).toHaveBeenCalledWith(THIRTY_ONE_OCTETS);
    expect(onReject).toHaveBeenCalledWith("not-hex:ZZ");
  });
});

describe("buildAssetLinks", () => {
  it("returns [] when fingerprints are empty", () => {
    expect(buildAssetLinks(identity, [])).toEqual([]);
  });

  it("returns one statement with the package and all fingerprints", () => {
    expect(buildAssetLinks(identity, [VALID_NORMALIZED, OTHER_FINGERPRINT])).toEqual([
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "com.stringsaeed.moneymanagement",
          sha256_cert_fingerprints: [VALID_NORMALIZED, OTHER_FINGERPRINT],
        },
      },
    ]);
  });
});

describe("parseOpenInAppRequest", () => {
  it("accepts magic and reset with a token", () => {
    expect(parseOpenInAppRequest("magic", "abc")).toEqual({
      ok: true,
      request: { kind: "magic", token: "abc" },
    });
    expect(parseOpenInAppRequest("reset", "xyz")).toEqual({
      ok: true,
      request: { kind: "reset", token: "xyz" },
    });
  });

  it("rejects unknown kinds and missing tokens", () => {
    expect(parseOpenInAppRequest("verify", "abc")).toEqual({ ok: false, reason: "unknown_kind" });
    expect(parseOpenInAppRequest("magic", null)).toEqual({ ok: false, reason: "missing_token" });
    expect(parseOpenInAppRequest("magic", "")).toEqual({ ok: false, reason: "missing_token" });
  });
});

describe("buildSchemeLink", () => {
  it("builds the authority-is-l form with an encoded token", () => {
    expect(buildSchemeLink("magic", "a b/c")).toBe("trove://l/magic?token=a%20b%2Fc");
    expect(buildSchemeLink("reset", "xyz")).toBe("trove://l/reset?token=xyz");
  });
});

describe("renderOpenInAppPage", () => {
  it("includes the scheme href, no script, and a Smart App Banner when appStoreId is set", () => {
    const html = renderOpenInAppPage({ kind: "magic", token: "abc" }, identity);

    expect(html).toContain('href="trove://l/magic?token=abc"');
    expect(html.toLowerCase()).not.toContain("<script");
    expect(html).toContain('name="apple-itunes-app"');
    expect(html).toContain("app-id=6799272091");
    expect(html).toContain("Finish signing in ✨");
    expect(html).toContain("<title>Open in Trove 📒</title>");
  });

  it("HTML-escapes a token that contains quotes and markup", () => {
    const html = renderOpenInAppPage({ kind: "reset", token: `"<>&` }, identity);

    expect(html).toContain("Reset your password 🔑");
    expect(html).toContain('href="trove://l/reset?token=%22%3C%3E%26"');
    expect(html).not.toContain(`token="${"<>&"}"`);
    expect(html).not.toContain("<script");
  });

  it("omits the Smart App Banner when appStoreId is absent", () => {
    const html = renderOpenInAppPage(
      { kind: "magic", token: "abc" },
      { ...identity, appStoreId: undefined },
    );

    expect(html).not.toContain("apple-itunes-app");
    expect(html).not.toContain("apps.apple.com");
  });
});
