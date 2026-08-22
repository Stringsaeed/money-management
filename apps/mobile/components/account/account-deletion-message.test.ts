import { accountDeletionMessage } from "@/components/account/account-deletion-message";

describe("accountDeletionMessage", () => {
  it("lists each affected Rule once", () => {
    expect(
      accountDeletionMessage("Wallet", {
        accountId: "account-1",
        rules: [
          { ruleId: "rule-1", name: "Savings sweep", relationship: "source" },
          { ruleId: "rule-1", name: "Savings sweep", relationship: "destination" },
          { ruleId: "rule-2", name: "Rent", relationship: "source" },
        ],
      }),
    ).toContain("2 Recurring Rules (Savings sweep, Rent) will be archived and need repair.");
  });
});
