import { AUTH_FALLBACK_PALETTE } from "@/components/auth/ui/tokens";

import { controlRecipe } from "./recipes";
import { NATIVE_CONTROL_SPECS, resolveNativeColor } from "./roles";

describe("resolveNativeColor", () => {
  const palette = AUTH_FALLBACK_PALETTE.light;

  it("resolves token, ring, destructive ring, and white refs", () => {
    expect(resolveNativeColor("--color-ink", palette)).toBe(palette["--color-ink"]);
    expect(resolveNativeColor("kumoRing", palette)).toBe(palette.kumoRing);
    expect(resolveNativeColor("destructiveRing", palette)).toBe("#da252e");
    expect(resolveNativeColor("white", palette)).toBe("#ffffff");
  });
});

describe("NATIVE_CONTROL_SPECS", () => {
  it("includes primary, secondary, tertiary, and destructive roles", () => {
    expect(Object.keys(NATIVE_CONTROL_SPECS).sort()).toEqual([
      "destructive",
      "primary",
      "secondary",
      "tertiary",
    ]);
  });
});

describe("controlRecipe", () => {
  it("puts width + label paint on the primary button (string label path)", () => {
    const recipe = controlRecipe("primary", AUTH_FALLBACK_PALETTE.light, false);
    const controlTypes = (recipe.control.modifiers ?? []).map((modifier) => modifier.$type);
    expect(controlTypes).toContain("frame");
    expect(controlTypes).toContain("fixedSize");
    expect(controlTypes).toContain("font");
    expect(controlTypes).toContain("foregroundStyle");
    expect(recipe.label.textStyle).toBeUndefined();
    expect(recipe.label.modifiers).toBeUndefined();
  });

  it("paints destructive with solid fill modifiers", () => {
    const recipe = controlRecipe("destructive", AUTH_FALLBACK_PALETTE.light, false);
    const controlTypes = (recipe.control.modifiers ?? []).map((modifier) => modifier.$type);
    expect(controlTypes).toContain("background");
    expect(controlTypes).toContain("strokeBorder");
    expect(controlTypes).toContain("opacity");
  });
});
