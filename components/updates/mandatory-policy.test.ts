import { isMandatoryUpdateManifest } from "./mandatory-policy";

describe("isMandatoryUpdateManifest", () => {
  it("recognizes an explicitly mandatory EAS Update manifest", () => {
    expect(
      isMandatoryUpdateManifest({
        extra: {
          expoClient: {
            extra: { ota: { mandatory: true } },
          },
        },
      }),
    ).toBe(true);
  });

  it.each([
    ["false", { extra: { expoClient: { extra: { ota: { mandatory: false } } } } }],
    ["absent", { extra: { expoClient: { extra: {} } } }],
    ["malformed", { extra: { expoClient: { extra: { ota: { mandatory: "true" } } } } }],
    ["embedded manifest", { extra: { ota: { mandatory: true } } }],
    ["null", null],
  ])("treats %s metadata as optional", (_label, manifest) => {
    expect(isMandatoryUpdateManifest(manifest)).toBe(false);
  });
});
