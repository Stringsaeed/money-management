import { describe, expect, it } from "@jest/globals";

import { isMandatoryUpdateManifest } from "./mandatory-policy";

describe("isMandatoryUpdateManifest", () => {
  it("detects mandatory OTA manifests and rejects everything else", () => {
    expect(
      isMandatoryUpdateManifest({
        extra: { expoClient: { extra: { ota: { mandatory: true } } } },
      }),
    ).toBe(true);
    expect(
      isMandatoryUpdateManifest({
        extra: { expoClient: { extra: { ota: { mandatory: false } } } },
      }),
    ).toBe(false);
    expect(isMandatoryUpdateManifest(null)).toBe(false);
    expect(isMandatoryUpdateManifest({})).toBe(false);
  });
});
