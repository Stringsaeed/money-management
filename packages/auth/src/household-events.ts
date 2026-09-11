import { type Event, WorkOS } from "@workos-inc/node";

import { type DirectoryMembership, toDirectoryMembership } from "./household-directory";

/**
 * A verified WorkOS event reduced to what the Membership projection needs.
 * `observedAt` is the event's WorkOS timestamp: the ordering key the
 * projection compares against, so a delayed or reordered delivery can never
 * overwrite a newer observation.
 */
export type HouseholdEvent =
  | {
      readonly kind: "membership";
      readonly eventId: string;
      readonly observedAt: Date;
      readonly membership: DirectoryMembership;
      /** `organization_membership.deleted`: the membership is gone whatever its payload status says. */
      readonly deleted: boolean;
    }
  | {
      readonly kind: "organization_deleted";
      readonly eventId: string;
      readonly observedAt: Date;
      readonly organizationId: string;
    }
  | { readonly kind: "ignored"; readonly eventId: string; readonly event: string };

export const HOUSEHOLD_WEBHOOK_EVENTS = [
  "organization_membership.created",
  "organization_membership.updated",
  "organization_membership.deleted",
  "organization.deleted",
] as const;

export function parseHouseholdEvent(event: Event): HouseholdEvent {
  switch (event.event) {
    case "organization_membership.created":
    case "organization_membership.updated":
    case "organization_membership.deleted":
      return {
        kind: "membership",
        eventId: event.id,
        observedAt: new Date(event.createdAt),
        membership: toDirectoryMembership(event.data),
        deleted: event.event === "organization_membership.deleted",
      };
    case "organization.deleted":
      return {
        kind: "organization_deleted",
        eventId: event.id,
        observedAt: new Date(event.createdAt),
        organizationId: event.data.id,
      };
    default:
      return { kind: "ignored", eventId: event.id, event: event.event };
  }
}

export class WebhookVerifyError extends Error {
  constructor(cause: unknown) {
    super("WorkOS webhook signature could not be verified.", { cause });
    this.name = "WebhookVerifyError";
  }
}

/**
 * Verifies the `WorkOS-Signature` header against the raw body. Only verified
 * events reach the projection; a body without a valid signature is dropped.
 */
export async function verifyWorkOSWebhook(input: {
  readonly apiKey: string;
  readonly payload: string;
  readonly sigHeader: string;
  readonly secret: string;
  /** Milliseconds of clock drift tolerated on the signature timestamp (default 3 minutes). */
  readonly toleranceMs?: number;
}): Promise<Event> {
  const workos = new WorkOS(input.apiKey);
  try {
    return await workos.webhooks.constructEvent({
      payload: input.payload,
      sigHeader: input.sigHeader,
      secret: input.secret,
      tolerance: input.toleranceMs ?? 180_000,
    });
  } catch (error) {
    throw new WebhookVerifyError(error);
  }
}
