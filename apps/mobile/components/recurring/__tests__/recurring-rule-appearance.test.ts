import { getRecurringRuleAppearance } from "@/components/recurring/recurring-rule-appearance";
import { rawColorValues } from "@/lib/design-tokens";
import { createRecurringRule } from "@/tests/test-utils/factories";

describe("getRecurringRuleAppearance", () => {
  it.each([
    ["active", { backgroundColor: `${rawColorValues.light.sage}1A` }, rawColorValues.light.sage],
    ["paused", { backgroundColor: rawColorValues.light.surfaceDim }, rawColorValues.light.ink],
    [
      "archived",
      { backgroundColor: `${rawColorValues.light.terracotta}1A` },
      rawColorValues.light.terracotta,
    ],
    [
      "completed",
      { backgroundColor: rawColorValues.light.surfaceContainer },
      rawColorValues.light.mutedForeground,
    ],
  ] as const)(
    "maps %s lifecycle to its screen and header treatment",
    (lifecycle, surfaceStyle, tint) => {
      expect(getRecurringRuleAppearance(createRecurringRule({ lifecycle }))).toEqual({
        iconTintColor: tint,
        surfaceStyle,
      });
    },
  );

  it("gives Needs Attention precedence over lifecycle", () => {
    expect(
      getRecurringRuleAppearance(
        createRecurringRule({ lifecycle: "archived", health: "needs_attention" }),
      ),
    ).toEqual({
      iconTintColor: rawColorValues.light.destructive,
      surfaceStyle: { backgroundColor: `${rawColorValues.light.terracotta}26` },
    });
  });
});
