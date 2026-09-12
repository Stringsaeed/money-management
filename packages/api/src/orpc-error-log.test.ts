import { ORPCError } from "@orpc/server";
import { describe, expect, it } from "vitest";

import { formatOrpcErrorLog } from "./orpc-error-log";

describe("formatOrpcErrorLog", () => {
  it("includes ORPC code and non-empty message in one string", () => {
    const error = new ORPCError("UNAUTHORIZED", { message: "Unauthorized (missing_token)" });
    expect(formatOrpcErrorLog(error)).toBe(
      "orpc_error code=UNAUTHORIZED message=Unauthorized (missing_token)",
    );
  });

  it("never emits an empty message field for blank Error.message", () => {
    const error = new Error("   ");
    error.name = "BlankError";
    expect(formatOrpcErrorLog(error)).toBe("orpc_error code=UNKNOWN message=BlankError");
  });

  it("surfaces postgres cause code and detail from a Failed query wrapper", () => {
    const error = new Error(
      'Failed query: insert into "user" ("memberships_reconciled_at") values (default)\nparams: ',
    );
    error.cause = {
      code: "42703",
      message: 'column "memberships_reconciled_at" of relation "user" does not exist',
      detail: "Drizzle listed a column missing from prod",
    };
    expect(formatOrpcErrorLog(error)).toBe(
      'orpc_error code=UNKNOWN message=Failed query: insert into "user" ("memberships_reconciled_at") values (default) params: pg_code=42703 cause=column "memberships_reconciled_at" of relation "user" does not exist detail=Drizzle listed a column missing from prod',
    );
  });
});
