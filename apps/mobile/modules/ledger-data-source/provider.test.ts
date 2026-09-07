import { selectLedgerSource } from "./provider";

describe("selectLedgerSource", () => {
  it("selects synced only for the persisted migrated active household", () => {
    expect(
      selectLedgerSource({
        authenticatedUserId: "user-1",
        activeHouseholdId: "household-1",
        migratedHouseholdId: "household-1",
        offlineReason: null,
      }),
    ).toEqual({ kind: "synced", householdId: "household-1", userId: "user-1" });
    expect(
      selectLedgerSource({
        authenticatedUserId: "user-1",
        activeHouseholdId: "household-2",
        migratedHouseholdId: "household-1",
        offlineReason: null,
      }),
    ).toEqual({ kind: "local" });
  });

  it("keeps a migrated household synced while degraded", () => {
    expect(
      selectLedgerSource({
        authenticatedUserId: "user-1",
        activeHouseholdId: "household-1",
        migratedHouseholdId: "household-1",
        offlineReason: "PowerSync has been disconnected for over 10 minutes.",
      }),
    ).toEqual({
      kind: "synced",
      householdId: "household-1",
      userId: "user-1",
      offlineState: {
        kind: "offline_cached",
        reason: "PowerSync has been disconnected for over 10 minutes.",
      },
    });
  });

  it("keeps anonymous and no-household sessions local", () => {
    expect(
      selectLedgerSource({
        authenticatedUserId: null,
        activeHouseholdId: "household-1",
        migratedHouseholdId: "household-1",
        offlineReason: null,
      }),
    ).toEqual({ kind: "local" });
    expect(
      selectLedgerSource({
        authenticatedUserId: "user-1",
        activeHouseholdId: null,
        migratedHouseholdId: "household-1",
        offlineReason: null,
      }),
    ).toEqual({ kind: "local" });
  });
});
