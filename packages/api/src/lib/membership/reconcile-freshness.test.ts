import type { DirectoryMembership } from "@trove/auth";
import { describe, expect, it } from "vitest";

import {
  HOUSEHOLD_RECONCILE_MAX_AGE_MS,
  TOKEN_RECONCILE_MAX_AGE_MS,
  USER_RECONCILE_MAX_AGE_MS,
  isStale,
  observationFromDirectory,
} from "./reconcile";

describe("isStale", () => {
  const now = new Date("2026-09-12T12:00:00.000Z");

  it("treats a null reconciliation as stale", () => {
    expect(isStale(null, now, USER_RECONCILE_MAX_AGE_MS)).toBe(true);
  });

  it("is fresh inside the max age and stale beyond it", () => {
    expect(isStale(new Date("2026-09-12T11:59:30.000Z"), now, USER_RECONCILE_MAX_AGE_MS)).toBe(
      false,
    );
    expect(isStale(new Date("2026-09-12T11:58:59.000Z"), now, USER_RECONCILE_MAX_AGE_MS)).toBe(
      true,
    );
  });

  it("uses the longer token bootstrap window", () => {
    expect(TOKEN_RECONCILE_MAX_AGE_MS).toBe(5 * 60_000);
    expect(HOUSEHOLD_RECONCILE_MAX_AGE_MS).toBe(60_000);
    expect(
      isStale(new Date("2026-09-12T11:56:00.000Z"), now, TOKEN_RECONCILE_MAX_AGE_MS),
    ).toBe(false);
  });
});

describe("observationFromDirectory", () => {
  const row: DirectoryMembership = {
    id: "om_1",
    organizationId: "org_1",
    userId: "user_1",
    roleSlug: "admin",
    status: "active",
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    updatedAt: new Date("2026-09-10T00:00:00.000Z"),
  };

  it("maps a directory row with observedAt from updatedAt and null eventId", () => {
    expect(observationFromDirectory(row)).toEqual({
      membershipId: "om_1",
      organizationId: "org_1",
      userId: "user_1",
      roleSlug: "admin",
      status: "active",
      observedAt: row.updatedAt,
      eventId: null,
      createdAt: row.createdAt,
    });
  });

  it("allows webhook overrides for status, observedAt, and eventId", () => {
    const observedAt = new Date("2026-09-11T00:00:00.000Z");
    expect(
      observationFromDirectory(row, {
        status: "inactive",
        observedAt,
        eventId: "evt_1",
      }),
    ).toMatchObject({
      status: "inactive",
      observedAt,
      eventId: "evt_1",
      membershipId: "om_1",
    });
  });
});
