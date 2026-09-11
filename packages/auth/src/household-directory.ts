import { WorkOS } from "@workos-inc/node";
import { z } from "zod";

/**
 * The WorkOS surface Trove uses to run Households as Organizations. Everything
 * that touches the WorkOS API for Households goes through this port so the
 * households router can be exercised against a fake directory.
 */

export type DirectoryMembershipStatus = "active" | "inactive" | "pending";

export interface DirectoryMembership {
  /** WorkOS organization membership id (`om_…`). */
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  /** Role slug as WorkOS reports it; unknown slugs are still recorded, never trusted. */
  readonly roleSlug: string;
  readonly status: DirectoryMembershipStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface DirectoryOrganization {
  readonly id: string;
  readonly name: string;
}

export interface DirectoryUser {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
}

export interface DirectoryInvitation {
  readonly id: string;
  readonly email: string;
  readonly expiresAt: Date;
}

export interface CreateOrganizationInput {
  readonly name: string;
  /** Idempotency key: the same key never yields a second Organization. */
  readonly idempotencyKey: string;
}

export interface CreateMembershipInput {
  readonly organizationId: string;
  readonly userId: string;
  readonly roleSlug: string;
}

export interface SendInvitationInput {
  readonly email: string;
  readonly organizationId: string;
  readonly inviterUserId: string;
  readonly roleSlug: string;
  readonly expiresInDays: number;
}

export interface HouseholdDirectory {
  createOrganization(input: CreateOrganizationInput): Promise<DirectoryOrganization>;
  renameOrganization(organizationId: string, name: string): Promise<void>;
  deleteOrganization(organizationId: string): Promise<void>;
  listUserMemberships(userId: string): Promise<readonly DirectoryMembership[]>;
  listOrganizationMemberships(organizationId: string): Promise<readonly DirectoryMembership[]>;
  createMembership(input: CreateMembershipInput): Promise<DirectoryMembership>;
  setMembershipRole(membershipId: string, roleSlug: string): Promise<DirectoryMembership>;
  deleteMembership(membershipId: string): Promise<void>;
  sendInvitation(input: SendInvitationInput): Promise<DirectoryInvitation>;
  getUser(userId: string): Promise<DirectoryUser | null>;
  /** Idempotent: a missing User is success (already deleted). */
  deleteUser(userId: string): Promise<void>;
  mintWidgetToken(input: {
    readonly userId: string;
    readonly organizationId: string;
  }): Promise<{ readonly token: string }>;
}

const ALL_STATUSES: readonly DirectoryMembershipStatus[] = ["active", "inactive", "pending"];

interface WorkOSMembershipRecord {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly role: { readonly slug: string };
  readonly status: DirectoryMembershipStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Normalizes the SDK membership object; also used by the webhook parser. */
export function toDirectoryMembership(raw: WorkOSMembershipRecord): DirectoryMembership {
  return {
    id: raw.id,
    organizationId: raw.organizationId,
    userId: raw.userId,
    roleSlug: raw.role.slug,
    status: raw.status,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
  };
}

const sdkFailureSchema = z.object({ status: z.number().optional() }).passthrough();

export function createWorkOSHouseholdDirectory(apiKey: string): HouseholdDirectory {
  const workos = new WorkOS(apiKey);
  return {
    async createOrganization(input) {
      const organization = await workos.organizations.createOrganization(
        { name: input.name },
        { idempotencyKey: input.idempotencyKey },
      );
      return { id: organization.id, name: organization.name };
    },
    async renameOrganization(organizationId, name) {
      await workos.organizations.updateOrganization({ organization: organizationId, name });
    },
    async deleteOrganization(organizationId) {
      try {
        await workos.organizations.deleteOrganization(organizationId);
      } catch (error) {
        const parsed = sdkFailureSchema.safeParse(error);
        if (!(parsed.success && parsed.data.status === 404)) throw error;
      }
    },
    async listUserMemberships(userId) {
      const page = await workos.userManagement.listOrganizationMemberships({
        userId,
        statuses: [...ALL_STATUSES],
        limit: 100,
      });
      const rows = await page.autoPagination();
      return rows.map(toDirectoryMembership);
    },
    async listOrganizationMemberships(organizationId) {
      const page = await workos.userManagement.listOrganizationMemberships({
        organizationId,
        statuses: [...ALL_STATUSES],
        limit: 100,
      });
      const rows = await page.autoPagination();
      return rows.map(toDirectoryMembership);
    },
    async createMembership(input) {
      const created = await workos.userManagement.createOrganizationMembership({
        organizationId: input.organizationId,
        userId: input.userId,
        roleSlug: input.roleSlug,
      });
      return toDirectoryMembership(created);
    },
    async setMembershipRole(membershipId, roleSlug) {
      const updated = await workos.userManagement.updateOrganizationMembership(membershipId, {
        roleSlug,
      });
      return toDirectoryMembership(updated);
    },
    async deleteMembership(membershipId) {
      try {
        await workos.userManagement.deleteOrganizationMembership(membershipId);
      } catch (error) {
        const parsed = sdkFailureSchema.safeParse(error);
        if (!(parsed.success && parsed.data.status === 404)) throw error;
      }
    },
    async sendInvitation(input) {
      const invitation = await workos.userManagement.sendInvitation({
        email: input.email,
        organizationId: input.organizationId,
        inviterUserId: input.inviterUserId,
        roleSlug: input.roleSlug,
        expiresInDays: input.expiresInDays,
      });
      return {
        id: invitation.id,
        email: invitation.email,
        expiresAt: new Date(invitation.expiresAt),
      };
    },
    async getUser(userId) {
      try {
        const user = await workos.userManagement.getUser(userId);
        return { id: user.id, email: user.email, name: user.name };
      } catch (error) {
        const parsed = sdkFailureSchema.safeParse(error);
        if (parsed.success && parsed.data.status === 404) return null;
        throw error;
      }
    },
    async deleteUser(userId) {
      try {
        await workos.userManagement.deleteUser(userId);
      } catch (error) {
        const parsed = sdkFailureSchema.safeParse(error);
        if (!(parsed.success && parsed.data.status === 404)) throw error;
      }
    },
    async mintWidgetToken(input) {
      const response = await workos.widgets.createToken({
        userId: input.userId,
        organizationId: input.organizationId,
        scopes: ["widgets:users-table:manage"],
      });
      return { token: response.token };
    },
  };
}
