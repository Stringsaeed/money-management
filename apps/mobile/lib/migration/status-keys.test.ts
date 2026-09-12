import { describe, expect, it } from "@jest/globals";

jest.mock("drizzle-orm", () => ({ eq: jest.fn() }));
jest.mock("@/db/schema", () => ({ appSettings: {} }));
jest.mock("@/utils/date", () => ({ nowIso: jest.fn() }));

import {
  COMPLETED_HOUSEHOLD_ID_KEY,
  PERSONAL_SYNC_USER_ID_KEY,
} from "./status";

describe("COMPLETED_HOUSEHOLD_ID_KEY", () => {
  it('locks migration completed-household setting key to "migration.completedHouseholdId"', () => {
    expect(COMPLETED_HOUSEHOLD_ID_KEY).toBe("migration.completedHouseholdId");
  });
});

describe("PERSONAL_SYNC_USER_ID_KEY", () => {
  it('locks personal-sync user setting key to "sync.personalLedgerUserId"', () => {
    expect(PERSONAL_SYNC_USER_ID_KEY).toBe("sync.personalLedgerUserId");
  });
});
