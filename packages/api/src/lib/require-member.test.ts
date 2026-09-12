import { ORPCError } from "@orpc/server";
import { personalLedgerId } from "@trove/protocol";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./membership/access", () => ({
  findActiveMembership: vi.fn(),
}));

import { findActiveMembership } from "./membership/access";
import {
  requireHouseholdMember,
  requireLedgerAccess,
  resolveReadLedgerId,
} from "./require-member";

const findActiveMembershipMock = vi.mocked(findActiveMembership);

describe("resolveReadLedgerId", () => {
  it("resolves personal scope to the caller personal ledger", () => {
    expect(resolveReadLedgerId("user_1", { scope: { type: "personal" } })).toBe(
      personalLedgerId("user_1"),
    );
  });

  it("resolves organization scope to the household ledger id", () => {
    expect(
      resolveReadLedgerId("user_1", {
        scope: { type: "organization", organizationId: "hh_1" },
      }),
    ).toBe("hh_1");
  });

  it("resolves legacy householdId to the organization ledger", () => {
    expect(resolveReadLedgerId("user_1", { householdId: "hh_legacy" })).toBe("hh_legacy");
  });

  it("rejects requests that name no ledger", () => {
    expect(() => resolveReadLedgerId("user_1", {})).toThrow(ORPCError);
  });
});

describe("requireLedgerAccess", () => {
  beforeEach(() => {
    findActiveMembershipMock.mockReset();
  });

  it("allows the owner of a personal ledger without membership lookup", async () => {
    await expect(
      requireLedgerAccess({} as never, "user_1", personalLedgerId("user_1")),
    ).resolves.toBeUndefined();
    expect(findActiveMembershipMock).not.toHaveBeenCalled();
  });

  it("forbids another user from a personal ledger", async () => {
    await expect(
      requireLedgerAccess({} as never, "user_2", personalLedgerId("user_1")),
    ).rejects.toBeInstanceOf(ORPCError);
  });

  it("checks household membership for organization ledgers", async () => {
    findActiveMembershipMock.mockResolvedValueOnce({ id: "m1", role: "viewer" });
    await expect(requireLedgerAccess({} as never, "user_1", "hh_1")).resolves.toBeUndefined();
    expect(findActiveMembershipMock).toHaveBeenCalledWith({} as never, "user_1", "hh_1");
  });
});

describe("requireHouseholdMember", () => {
  beforeEach(() => {
    findActiveMembershipMock.mockReset();
  });

  it("passes for an active membership", async () => {
    findActiveMembershipMock.mockResolvedValueOnce({ id: "m1", role: "member" });
    await expect(requireHouseholdMember({} as never, "user_1", "hh_1")).resolves.toBeUndefined();
  });

  it("forbids when membership is missing", async () => {
    findActiveMembershipMock.mockResolvedValueOnce(null);
    await expect(requireHouseholdMember({} as never, "user_1", "hh_1")).rejects.toBeInstanceOf(
      ORPCError,
    );
  });
});
