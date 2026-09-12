import type { CommandKind } from "@trove/protocol";

import { commandKindLabel } from "./intent-summary";

const KIND_LABELS: Record<CommandKind, string> = {
  "account.create": "New account",
  "account.update": "Update account",
  "account.archive": "Archive account",
  "category.create": "New category",
  "category.update": "Update category",
  "category.archive": "Archive category",
  "transaction.create": "Record transaction",
  "transaction.edit": "Edit transaction",
  "transaction.remove": "Delete transaction",
  "recurring.change": "Change recurring rule",
  "budget.configure": "Change budget",
  "assignment.commit": "Assign transactions",
  "assignment.correct": "Correct assignment",
  "refund.link": "Link refund",
  import_bundle: "Import data",
};

describe("commandKindLabel", () => {
  it("maps every command kind to its human label", () => {
    for (const [kind, label] of Object.entries(KIND_LABELS) as [CommandKind, string][]) {
      expect(commandKindLabel(kind)).toBe(label);
    }
  });
});
