import { describe, expect, it } from "vitest";

import {
  TROVE_APP_IDENTITY,
  buildAppleAppSiteAssociation,
  buildAssetLinks,
  parseCertFingerprints,
} from "../app-association";

describe("buildAppleAppSiteAssociation", () => {
  it("exposes webcredentials without legacy /l/ applink paths", () => {
    const aasa = buildAppleAppSiteAssociation(TROVE_APP_IDENTITY);
    expect(aasa.applinks.details).toEqual([]);
    expect(aasa.webcredentials?.apps).toEqual(["V3HN8HXZYK.com.stringsaeed.moneymanagement"]);
  });
});

describe("buildAssetLinks", () => {
  it("returns no statements when fingerprints are empty", () => {
    expect(buildAssetLinks(TROVE_APP_IDENTITY, [])).toEqual([]);
  });

  it("builds android app link statements from fingerprints", () => {
    const fp = "AA".repeat(32);
    const formatted = Array.from({ length: 32 }, () => "AA").join(":");
    expect(buildAssetLinks(TROVE_APP_IDENTITY, [formatted])).toMatchObject([
      {
        target: {
          package_name: TROVE_APP_IDENTITY.androidPackage,
          sha256_cert_fingerprints: [formatted],
        },
      },
    ]);
    expect(parseCertFingerprints(fp.replaceAll(":", ""))).toEqual([formatted]);
  });
});
