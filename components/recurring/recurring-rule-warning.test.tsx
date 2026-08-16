import { render, screen } from "@testing-library/react-native";

import { RecurringRuleWarning } from "@/components/recurring/recurring-rule-warning";
import { createRecurringRule } from "@/tests/test-utils/factories";

describe("RecurringRuleWarning", () => {
  it("stays out of the form when a Rule is healthy", async () => {
    await render(<RecurringRuleWarning rule={createRecurringRule()} />);

    expect(screen.queryByText(/Recurring Rule needs attention/)).not.toBeOnTheScreen();
  });

  it("shows a repair banner when a Rule needs attention", async () => {
    await render(
      <RecurringRuleWarning
        rule={createRecurringRule({
          health: "needs_attention",
          attentionReasons: [{ kind: "missing-source-account", formerAccountId: "account-1" }],
        })}
      />,
    );

    expect(screen.getByText(/Recurring Rule needs attention/)).toBeOnTheScreen();
    expect(screen.getByText(/save to repair this Rule/)).toBeOnTheScreen();
  });
});
