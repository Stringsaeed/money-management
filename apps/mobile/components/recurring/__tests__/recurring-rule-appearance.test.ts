import { getRecurringRuleAppearance } from "@/components/recurring/recurring-rule-appearance";
import { createRecurringRule } from "@/tests/test-utils/factories";

describe("getRecurringRuleAppearance", () => {
  it.each([
    ["active", "bg-sage/10", "#4A8F69"],
    ["paused", "bg-surface-dim", "#2C5F47"],
    ["archived", "bg-terracotta/10", "#D46A4C"],
    ["completed", "bg-surface-container", "#6E8A7C"],
  ] as const)(
    "maps %s lifecycle to its screen and header treatment",
    (lifecycle, surface, tint) => {
      expect(getRecurringRuleAppearance(createRecurringRule({ lifecycle }))).toEqual({
        iconTintColor: tint,
        surfaceClassName: surface,
      });
    },
  );

  it("gives Needs Attention precedence over lifecycle", () => {
    expect(
      getRecurringRuleAppearance(
        createRecurringRule({ lifecycle: "archived", health: "needs_attention" }),
      ),
    ).toEqual({
      iconTintColor: "#C4452F",
      surfaceClassName: "bg-terracotta/15",
    });
  });
});
