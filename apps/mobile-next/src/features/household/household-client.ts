import { z } from "zod";

import { apiRequest } from "@/data/http";

const roleSchema = z.enum(["admin", "member", "viewer"]);
const memberSchema = z.object({
  membershipId: z.string(),
  userId: z.string(),
  userName: z.string(),
  userEmail: z.string(),
  role: roleSchema,
  status: z.enum(["active", "inactive", "pending"]),
  joinedAt: z.string(),
});
const householdSchema = z.object({
  householdId: z.string(),
  name: z.string(),
  role: roleSchema,
  joinedAt: z.string(),
  createdByUserId: z.string().optional(),
  members: z.array(memberSchema).optional(),
});
const householdDetailSchema = householdSchema.extend({ members: z.array(memberSchema) });

export type HouseholdSummary = z.infer<typeof householdSchema>;
export type HouseholdDetail = HouseholdSummary & {
  readonly members: z.infer<typeof memberSchema>[];
};

const listSchema = z.object({ households: z.array(householdSchema) });
const inviteSchema = z.object({ invitationId: z.string(), expiresAt: z.string() });

export const householdClient = {
  list: async (): Promise<HouseholdSummary[]> => {
    const result = await apiRequest("/households", { schema: listSchema });
    return result.households;
  },
  get: (householdId: string) =>
    apiRequest(`/households/${encodeURIComponent(householdId)}`, { schema: householdDetailSchema }),
  create: (name: string) =>
    apiRequest("/households", {
      method: "POST",
      body: JSON.stringify({ name, requestId: crypto.randomUUID() }),
      schema: z.object({ householdId: z.string(), name: z.string() }),
    }),
  invite: (householdId: string, email: string, role: "admin" | "member" | "viewer" = "member") =>
    apiRequest(`/households/${encodeURIComponent(householdId)}/invites`, {
      method: "POST",
      body: JSON.stringify({ email, role }),
      schema: inviteSchema,
    }),
  setMemberRole: (householdId: string, userId: string, role: "admin" | "member" | "viewer") =>
    apiRequest(
      `/households/${encodeURIComponent(householdId)}/members/${encodeURIComponent(userId)}/role`,
      {
        method: "POST",
        body: JSON.stringify({ role }),
        schema: z.object({ ok: z.literal(true) }),
      },
    ).then(() => undefined),
  leave: (householdId: string) =>
    apiRequest(`/households/${encodeURIComponent(householdId)}/leave`, {
      method: "POST",
      schema: z.object({ ok: z.literal(true) }),
    }),
};
