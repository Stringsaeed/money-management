import { resolveColor } from "./roles";
import { AUTH_FALLBACK_PALETTE } from "./tokens";

describe("resolveColor", () => {
  const palette = AUTH_FALLBACK_PALETTE.light;

  it("resolves token, ring, and white refs", () => {
    expect(resolveColor("--color-ink", palette)).toBe(palette["--color-ink"]);
    expect(resolveColor("kumoRing", palette)).toBe(palette.kumoRing);
    expect(resolveColor("white", palette)).toBe("#ffffff");
  });
});
