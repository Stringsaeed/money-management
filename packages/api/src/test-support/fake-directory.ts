import type {
  DirectoryMembership,
  DirectoryMembershipStatus,
  DirectoryUser,
  HouseholdDirectory,
} from "@trove/auth";

/**
 * In-memory stand-in for WorkOS with the same idempotency semantics Trove
 * relies on: an organization create with a known idempotency key returns the
 * organization it already made, and one (organization, user) pair holds at
 * most one membership.
 */
export interface FakeDirectory extends HouseholdDirectory {
  readonly organizations: Map<string, { id: string; name: string; deleted: boolean }>;
  readonly memberships: Map<string, DirectoryMembership>;
  readonly users: Map<string, DirectoryUser>;
  readonly invitations: { id: string; email: string; organizationId: string; roleSlug: string }[];
  readonly calls: string[];
  seedUser(user: DirectoryUser): void;
  seedMembership(input: {
    organizationId: string;
    userId: string;
    roleSlug: string;
    status?: DirectoryMembershipStatus;
    at?: Date;
    id?: string;
  }): DirectoryMembership;
  /** Makes the next call to `method` throw once, then behave normally. */
  failNext(method: keyof HouseholdDirectory, message?: string): void;
  tick(): Date;
}

export function createFakeDirectory(start = new Date("2026-09-01T00:00:00.000Z")): FakeDirectory {
  let clock = start.getTime();
  let counter = 0;
  const idempotency = new Map<string, string>();
  const failures = new Map<string, string>();

  const next = (prefix: string) => `${prefix}_${(counter += 1).toString().padStart(4, "0")}`;
  const tick = () => new Date((clock += 1_000));
  const guard = (method: keyof HouseholdDirectory) => {
    directory.calls.push(method);
    const failure = failures.get(method);
    if (failure !== undefined) {
      failures.delete(method);
      throw new Error(failure);
    }
  };
  const findMembership = (organizationId: string, userId: string) =>
    [...directory.memberships.values()].find(
      (row) => row.organizationId === organizationId && row.userId === userId,
    );

  const directory: FakeDirectory = {
    organizations: new Map(),
    memberships: new Map(),
    users: new Map(),
    invitations: [],
    calls: [],
    tick,
    seedUser(user) {
      directory.users.set(user.id, user);
    },
    seedMembership(input) {
      const at = input.at ?? tick();
      const row: DirectoryMembership = {
        id: input.id ?? next("om"),
        organizationId: input.organizationId,
        userId: input.userId,
        roleSlug: input.roleSlug,
        status: input.status ?? "active",
        createdAt: at,
        updatedAt: at,
      };
      const existing = findMembership(input.organizationId, input.userId);
      if (existing) directory.memberships.delete(existing.id);
      directory.memberships.set(row.id, row);
      return row;
    },
    failNext(method, message = `${method} failed`) {
      failures.set(method, message);
    },
    async createOrganization(input) {
      guard("createOrganization");
      const known = idempotency.get(input.idempotencyKey);
      if (known) {
        const organization = directory.organizations.get(known);
        if (organization) return { id: organization.id, name: organization.name };
      }
      const id = next("org");
      directory.organizations.set(id, { id, name: input.name, deleted: false });
      idempotency.set(input.idempotencyKey, id);
      return { id, name: input.name };
    },
    async renameOrganization(organizationId, name) {
      guard("renameOrganization");
      const organization = directory.organizations.get(organizationId);
      if (!organization) throw new Error("organization not found");
      organization.name = name;
    },
    async deleteOrganization(organizationId) {
      guard("deleteOrganization");
      const organization = directory.organizations.get(organizationId);
      if (organization) organization.deleted = true;
      for (const [id, row] of directory.memberships) {
        if (row.organizationId === organizationId) directory.memberships.delete(id);
      }
    },
    async listUserMemberships(userId) {
      guard("listUserMemberships");
      return [...directory.memberships.values()].filter((row) => row.userId === userId);
    },
    async listOrganizationMemberships(organizationId) {
      guard("listOrganizationMemberships");
      return [...directory.memberships.values()].filter(
        (row) => row.organizationId === organizationId,
      );
    },
    async createMembership(input) {
      guard("createMembership");
      if (findMembership(input.organizationId, input.userId)) {
        throw new Error("membership already exists");
      }
      return directory.seedMembership(input);
    },
    async setMembershipRole(membershipId, roleSlug) {
      guard("setMembershipRole");
      const row = directory.memberships.get(membershipId);
      if (!row) throw new Error("membership not found");
      const updated = { ...row, roleSlug, updatedAt: tick() };
      directory.memberships.set(membershipId, updated);
      return updated;
    },
    async deleteMembership(membershipId) {
      guard("deleteMembership");
      directory.memberships.delete(membershipId);
    },
    async sendInvitation(input) {
      guard("sendInvitation");
      const id = next("invitation");
      directory.invitations.push({
        id,
        email: input.email,
        organizationId: input.organizationId,
        roleSlug: input.roleSlug,
      });
      return {
        id,
        email: input.email,
        expiresAt: new Date(clock + input.expiresInDays * 86_400_000),
      };
    },
    async getUser(userId) {
      guard("getUser");
      return directory.users.get(userId) ?? null;
    },
    async mintWidgetToken(input) {
      guard("mintWidgetToken");
      return { token: `widget-token:${input.userId}:${input.organizationId}` };
    },
  };
  return directory;
}
