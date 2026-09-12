import { ORPCError } from "@orpc/server";
import { describe, expect, it } from "vitest";

import { requireUserId } from "./require-user";

describe("requireUserId", () => {
  it("returns the session user id", () => {
    expect(
      requireUserId({ session: { user: { id: "user_1" } } } as never),
    ).toBe("user_1");
  });

  it("throws UNAUTHORIZED when the session is missing", () => {
    expect(() => requireUserId({ session: null } as never)).toThrow(ORPCError);
    expect(() => requireUserId({} as never)).toThrow(ORPCError);
  });
});
