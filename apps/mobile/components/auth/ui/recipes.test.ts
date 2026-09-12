import { controlRecipe, fieldRecipe } from "./recipes";
import { controlLabelStyle, fieldBoxStyle } from "./recipe-core";
import { AUTH_CONTROL_SPECS, resolveColor } from "./roles";
import { AUTH_FALLBACK_PALETTE, fontFace } from "./tokens";

describe("controlLabelStyle", () => {
  const palette = AUTH_FALLBACK_PALETTE.light;

  it("maps each control role label from AUTH_CONTROL_SPECS", () => {
    for (const role of ["primary", "secondary", "tertiary"] as const) {
      const spec = AUTH_CONTROL_SPECS[role].label;
      expect(controlLabelStyle(role, palette)).toEqual({
        fontFamily: fontFace(spec.weight),
        fontSize: spec.size,
        color: resolveColor(spec.color, palette),
        lineHeight: spec.lineHeight,
        textAlign: "center",
      });
    }
  });

  it("resolves primary label color to white and secondary to palette foreground", () => {
    expect(controlLabelStyle("primary", palette).color).toBe("#ffffff");
    expect(controlLabelStyle("secondary", palette).color).toBe(palette["--color-foreground"]);
    expect(controlLabelStyle("tertiary", palette).color).toBe(palette["--color-muted-foreground"]);
  });
});

describe("fieldBoxStyle", () => {
  it("pairs borderWidth with borderColor so transformStyle keeps the stroke", () => {
    const style = fieldBoxStyle(AUTH_FALLBACK_PALETTE.light);
    expect(style.borderWidth).toBe(1);
    expect(style.borderColor).toBe(AUTH_FALLBACK_PALETTE.light["--color-input"]);
  });
});

describe("fieldRecipe", () => {
  it("paints the field with strokeBorder instead of clipShape border chrome", () => {
    const recipe = fieldRecipe(AUTH_FALLBACK_PALETTE.light);
    expect(recipe.style?.borderRadius).toBeUndefined();
    expect(recipe.style?.borderWidth).toBeUndefined();
    const types = (recipe.modifiers ?? []).map((modifier) => modifier.$type);
    expect(types).toContain("strokeBorder");
    expect(types).toContain("background");
    expect(types).toContain("frame");
    expect(types).not.toContain("clipShape");
    expect(types).not.toContain("border");
  });
});

describe("controlRecipe", () => {
  it("puts width + label paint on the button (string label path)", () => {
    const recipe = controlRecipe("primary", AUTH_FALLBACK_PALETTE.light, false);
    const controlTypes = (recipe.control.modifiers ?? []).map((modifier) => modifier.$type);
    expect(controlTypes).toContain("frame");
    expect(controlTypes).toContain("fixedSize");
    expect(controlTypes).toContain("font");
    expect(controlTypes).toContain("foregroundStyle");
    expect(recipe.label.textStyle).toBeUndefined();
    expect(recipe.label.modifiers).toBeUndefined();
  });
});
