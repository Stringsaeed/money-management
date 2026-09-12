import { personalLedgerId } from "@trove/protocol";

import { householdImportBinding, personalImportBinding } from "./import-binding";

describe("householdImportBinding", () => {
  it("targets the household ledger with matching householdId and ledgerId", () => {
    expect(householdImportBinding("household_01")).toEqual({
      kind: "household",
      householdId: "household_01",
      ledgerId: "household_01",
    });
  });
});

describe("personalImportBinding", () => {
  it("targets the personal ledger id for the user", () => {
    expect(personalImportBinding("user_01")).toEqual({
      kind: "personal",
      ledgerId: personalLedgerId("user_01"),
    });
    expect(personalImportBinding("user_01").ledgerId).toBe("personal:user_01");
  });
});
