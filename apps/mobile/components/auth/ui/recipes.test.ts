import { controlRecipe, fieldRecipe } from "./recipes";
import { fieldBoxStyle } from "./recipe-core";
import { AUTH_FALLBACK_PALETTE } from "./tokens";

function assertJsonSafeModifiers(modifiers: readonly { readonly $type: string }[] | undefined) {
  for (const modifier of modifiers ?? []) {
    const serialized = JSON.stringify(modifier);
    expect(serialized).not.toMatch(/"maxWidth":null/);
    expect(serialized).not.toContain("Infinity");
  }
}

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
    expect(types).toContain("containerRelativeFrame");
    expect(types).toContain("frame");
    expect(types).not.toContain("clipShape");
    expect(types).not.toContain("border");
    assertJsonSafeModifiers(recipe.modifiers);
  });
});

describe("controlRecipe", () => {
  it("puts width + label paint on the button (string label path)", () => {
    const recipe = controlRecipe("primary", AUTH_FALLBACK_PALETTE.light, false);
    const controlTypes = (recipe.control.modifiers ?? []).map((modifier) => modifier.$type);
    expect(controlTypes).toContain("containerRelativeFrame");
    expect(controlTypes).toContain("frame");
    expect(controlTypes).toContain("fixedSize");
    expect(controlTypes).toContain("font");
    expect(controlTypes).toContain("foregroundStyle");
    expect(recipe.label.textStyle).toBeUndefined();
    expect(recipe.label.modifiers).toBeUndefined();
    assertJsonSafeModifiers(recipe.control.modifiers);
  });
});
