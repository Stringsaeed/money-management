import { householdLedgerBinding, personalLedgerBinding, selectLedgerSource } from "../provider";

const facts = (overrides: Partial<Parameters<typeof selectLedgerSource>[0]> = {}) => ({
  authenticatedUserId: null,
  activeHouseholdId: null,
  migratedHouseholdId: null,
  personalSyncUserId: null,
  offlineReason: null,
  ...overrides,
});

describe("selectLedgerSource", () => {
  it("selects synced only for the persisted migrated active household", () => {
    expect(
      selectLedgerSource(
        facts({
          authenticatedUserId: "user-1",
          activeHouseholdId: "household-1",
          migratedHouseholdId: "household-1",
        }),
      ),
    ).toEqual({
      kind: "synced",
      ledger: householdLedgerBinding("household-1"),
      userId: "user-1",
    });
    expect(
      selectLedgerSource(
        facts({
          authenticatedUserId: "user-1",
          activeHouseholdId: "household-2",
          migratedHouseholdId: "household-1",
        }),
      ),
    ).toEqual({ kind: "local" });
  });

  it("keeps a migrated household synced while degraded", () => {
    expect(
      selectLedgerSource(
        facts({
          authenticatedUserId: "user-1",
          activeHouseholdId: "household-1",
          migratedHouseholdId: "household-1",
          offlineReason: "PowerSync has been disconnected for over 10 minutes.",
        }),
      ),
    ).toEqual({
      kind: "synced",
      ledger: householdLedgerBinding("household-1"),
      userId: "user-1",
      offlineState: {
        kind: "offline_cached",
        reason: "PowerSync has been disconnected for over 10 minutes.",
      },
    });
  });

  it("stays local for anonymous sessions and for households this device never migrated", () => {
    expect(
      selectLedgerSource(
        facts({ activeHouseholdId: "household-1", migratedHouseholdId: "household-1" }),
      ),
    ).toEqual({ kind: "local" });
    expect(
      selectLedgerSource(
        facts({ authenticatedUserId: "user-1", migratedHouseholdId: "household-1" }),
      ),
    ).toEqual({ kind: "local" });
  });

  it("syncs the Personal Ledger for a signed-in user who opted in", () => {
    expect(
      selectLedgerSource(facts({ authenticatedUserId: "user-1", personalSyncUserId: "user-1" })),
    ).toEqual({
      kind: "synced",
      ledger: { ledgerId: "personal:user-1", scope: { type: "personal" }, householdId: null },
      userId: "user-1",
    });
  });

  it("does not inherit another user's personal opt-in", () => {
    expect(
      selectLedgerSource(facts({ authenticatedUserId: "user-2", personalSyncUserId: "user-1" })),
    ).toEqual({ kind: "local" });
  });

  it("prefers a migrated Household over a personal opt-in so uploaded rows stay visible", () => {
    expect(
      selectLedgerSource(
        facts({
          authenticatedUserId: "user-1",
          activeHouseholdId: "household-1",
          migratedHouseholdId: "household-1",
          personalSyncUserId: "user-1",
        }),
      ),
    ).toEqual({
      kind: "synced",
      ledger: householdLedgerBinding("household-1"),
      userId: "user-1",
    });
  });

  it("hands out one binding object per ledger so the ledger is not rebuilt each render", () => {
    expect(personalLedgerBinding("user-1")).toBe(personalLedgerBinding("user-1"));
    expect(householdLedgerBinding("household-1")).toBe(householdLedgerBinding("household-1"));
    expect(personalLedgerBinding("user-1")).not.toBe(personalLedgerBinding("user-2"));
  });
});
