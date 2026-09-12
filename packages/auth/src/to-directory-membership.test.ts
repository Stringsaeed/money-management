import { describe, expect, it } from "vitest";

import { toDirectoryMembership } from "./household-directory";

type WorkOSMembershipRecord = Parameters<typeof toDirectoryMembership>[0];

function asMembershipRecord(value: {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly role: { readonly slug: string };
  readonly status: "active" | "inactive" | "pending";
  readonly createdAt: string;
  readonly updatedAt: string;
}): WorkOSMembershipRecord {
  // SAFETY: fixture matches the WorkOSMembershipRecord fields toDirectoryMembership reads.
  return value;
}

describe("toDirectoryMembership", () => {
  it("maps WorkOS membership fields and parses created/updated timestamps", () => {
    expect(
      toDirectoryMembership(
        asMembershipRecord({
          id: "om_01",
          organizationId: "org_01",
          userId: "user_01",
          role: { slug: "admin" },
          status: "active",
          createdAt: "2026-09-01T10:00:00.000Z",
          updatedAt: "2026-09-01T10:00:05.000Z",
        }),
      ),
    ).toEqual({
      id: "om_01",
      organizationId: "org_01",
      userId: "user_01",
      roleSlug: "admin",
      status: "active",
      createdAt: new Date("2026-09-01T10:00:00.000Z"),
      updatedAt: new Date("2026-09-01T10:00:05.000Z"),
    });
  });

  it("preserves unknown role slugs and non-active statuses", () => {
    expect(
      toDirectoryMembership(
        asMembershipRecord({
          id: "om_02",
          organizationId: "org_02",
          userId: "user_02",
          role: { slug: "billing_manager" },
          status: "pending",
          createdAt: "2026-09-02T00:00:00.000Z",
          updatedAt: "2026-09-02T00:00:01.000Z",
        }),
      ),
    ).toMatchObject({
      roleSlug: "billing_manager",
      status: "pending",
    });

    expect(
      toDirectoryMembership(
        asMembershipRecord({
          id: "om_03",
          organizationId: "org_03",
          userId: "user_03",
          role: { slug: "member" },
          status: "inactive",
          createdAt: "2026-09-03T00:00:00.000Z",
          updatedAt: "2026-09-03T00:00:01.000Z",
        }),
      ).status,
    ).toBe("inactive");
  });
});
