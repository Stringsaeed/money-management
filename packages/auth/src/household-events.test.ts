import type { Event } from "@workos-inc/node";
import { describe, expect, it } from "vitest";

import { HOUSEHOLD_WEBHOOK_EVENTS, parseHouseholdEvent } from "./household-events";

describe("HOUSEHOLD_WEBHOOK_EVENTS", () => {
  it("lists every WorkOS event kind the household projection handles", () => {
    expect([...HOUSEHOLD_WEBHOOK_EVENTS]).toEqual([
      "organization_membership.created",
      "organization_membership.updated",
      "organization_membership.deleted",
      "organization.deleted",
    ]);
  });

  it("does not include ignored or unrelated WorkOS events", () => {
    expect(HOUSEHOLD_WEBHOOK_EVENTS).not.toContain("user.created");
    expect(HOUSEHOLD_WEBHOOK_EVENTS).not.toContain("session.created");
  });
});

const membershipData = {
  object: "organization_membership" as const,
  id: "om_01",
  organizationId: "org_01",
  organizationName: "Home",
  userId: "user_01",
  directoryManaged: false,
  status: "active" as const,
  role: { slug: "member" },
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:05.000Z",
  customAttributes: {},
};

function asEvent(value: {
  readonly id: string;
  readonly event: string;
  readonly createdAt: string;
  readonly context: undefined;
  readonly data: unknown;
}): Event {
  // SAFETY: tests build the subset of WorkOS Event fields parseHouseholdEvent reads.
  return value as Event;
}

describe("parseHouseholdEvent", () => {
  it("reduces membership events to observations keyed by the event time", () => {
    const parsed = parseHouseholdEvent(
      asEvent({
        id: "event_01",
        event: "organization_membership.updated",
        createdAt: "2026-09-01T10:00:06.000Z",
        context: undefined,
        data: membershipData,
      }),
    );
    expect(parsed).toEqual({
      kind: "membership",
      eventId: "event_01",
      observedAt: new Date("2026-09-01T10:00:06.000Z"),
      deleted: false,
      membership: {
        id: "om_01",
        organizationId: "org_01",
        userId: "user_01",
        roleSlug: "member",
        status: "active",
        createdAt: new Date("2026-09-01T10:00:00.000Z"),
        updatedAt: new Date("2026-09-01T10:00:05.000Z"),
      },
    });
  });

  it("marks deletions regardless of the payload status", () => {
    const parsed = parseHouseholdEvent(
      asEvent({
        id: "event_02",
        event: "organization_membership.deleted",
        createdAt: "2026-09-01T10:01:00.000Z",
        context: undefined,
        data: membershipData,
      }),
    );
    expect(parsed).toMatchObject({ kind: "membership", deleted: true });
  });

  it("surfaces organization deletions and ignores everything else", () => {
    expect(
      parseHouseholdEvent(
        asEvent({
          id: "event_03",
          event: "organization.deleted",
          createdAt: "2026-09-01T10:02:00.000Z",
          context: undefined,
          data: { id: "org_01", name: "Home" },
        }),
      ),
    ).toEqual({
      kind: "organization_deleted",
      eventId: "event_03",
      observedAt: new Date("2026-09-01T10:02:00.000Z"),
      organizationId: "org_01",
    });
    expect(
      parseHouseholdEvent(
        asEvent({
          id: "event_04",
          event: "user.updated",
          createdAt: "2026-09-01T10:03:00.000Z",
          context: undefined,
          data: {},
        }),
      ),
    ).toEqual({ kind: "ignored", eventId: "event_04", event: "user.updated" });
  });
});
