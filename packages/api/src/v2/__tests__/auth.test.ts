import { beforeEach, describe, expect, it } from "vitest";

import { createTestDb } from "../../test-support/db";
import { eq } from "drizzle-orm";
import { v2GuestSession } from "@trove/db/schema/v2-identity";
import {
  claimGuestSession,
  guestTokenFromAuthorization,
  issueGuestSession,
  resolveGuestPrincipal,
  revokeGuestSession,
  type V2AuthDeps,
  type V2UserPrincipal,
} from "../auth";

describe("V2 guest auth", () => {
  let deps: V2AuthDeps;
  const now = new Date("2026-09-21T10:00:00.000Z");
  const user: V2UserPrincipal = {
    kind: "user",
    userId: "user_v2",
    workosUserId: "user_v2",
    email: "user@example.com",
    name: "V2 User",
  };

  beforeEach(async () => {
    deps = {
      db: await createTestDb({ householdLedgerMirror: false }),
      now: () => now,
      claimGuestLedger: async () => "claimed",
    };
  });

  it("accepts only the Guest authorization scheme and never treats a bearer as guest", () => {
    expect(guestTokenFromAuthorization("Guest opaque-token")).toBe("opaque-token");
    expect(guestTokenFromAuthorization("Bearer opaque-token")).toBeNull();
    expect(guestTokenFromAuthorization(null, "header-token")).toBe("header-token");
  });

  it("stores only a hash, expires, and revokes the opaque guest credential", async () => {
    const issued = await issueGuestSession(deps, { clientKey: "198.51.100.4" });
    expect(issued.token).not.toContain(issued.principal.guestSessionId);
    expect(await resolveGuestPrincipal(deps, issued.token)).toEqual(issued.principal);

    const rawRows = await deps.db
      .select({ tokenHash: v2GuestSession.tokenHash })
      .from(v2GuestSession)
      .where(eq(v2GuestSession.id, issued.principal.guestSessionId));
    expect(rawRows[0]?.tokenHash).not.toBe(issued.token);

    await revokeGuestSession(deps, issued.token);
    await expect(resolveGuestPrincipal(deps, issued.token)).rejects.toMatchObject({
      code: "guest_session_invalid",
    });
  });

  it("claims once and makes a second claim idempotent for the same user", async () => {
    const issued = await issueGuestSession(deps, { clientKey: "198.51.100.5" });
    await expect(claimGuestSession(deps, { token: issued.token, user })).resolves.toMatchObject({
      status: "claimed",
    });
    await expect(claimGuestSession(deps, { token: issued.token, user })).resolves.toMatchObject({
      status: "already_claimed",
    });
  });
});
