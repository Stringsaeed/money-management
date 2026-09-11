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
});
