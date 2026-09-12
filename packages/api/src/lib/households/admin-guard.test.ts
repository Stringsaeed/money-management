import { describe, expect, it } from "vitest";

import { LAST_ADMIN_MESSAGE, canDropAdmin } from "./admin-guard";

describe("canDropAdmin", () => {
  it("allows demotion when another active admin remains", () => {
    expect(
      canDropAdmin(
        [
          { userId: "u_admin", role: "admin" },
          { userId: "u_other", role: "admin" },
          { userId: "u_member", role: "member" },
        ],
        "u_admin",
      ),
    ).toBe(true);
  });

  it("blocks demotion of the sole admin", () => {
    expect(
      canDropAdmin(
        [
          { userId: "u_admin", role: "admin" },
          { userId: "u_member", role: "member" },
          { userId: "u_viewer", role: "viewer" },
        ],
        "u_admin",
      ),
    ).toBe(false);
  });

  it("ignores non-admin roles when deciding sole-admin", () => {
    expect(
      canDropAdmin(
        [
          { userId: "u_admin", role: "admin" },
          { userId: "u_billing", role: "billing" },
        ],
        "u_admin",
      ),
    ).toBe(false);
  });
});

describe("LAST_ADMIN_MESSAGE", () => {
  it("tells the operator how to unblock the guard", () => {
    expect(LAST_ADMIN_MESSAGE).toBe(
      "This Household would have no admin left. Make another member an admin first, or delete the Household.",
    );
  });
});
