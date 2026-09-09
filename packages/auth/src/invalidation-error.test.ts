import { afterEach, describe, expect, it, vi } from "vitest";

import { rethrowInvalidationError } from "./invalidation-error";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("auth invalidation errors", () => {
  it("logs non-PII operation metadata and preserves the database cause", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const databaseError = Object.assign(new Error("query contains private parameters"), {
      code: "42883",
    });
    const wrappedError = new Error("Failed query", { cause: databaseError });

    expect(() => rethrowInvalidationError("magic", wrappedError)).toThrow(
      "Could not invalidate prior magic links.",
    );
    expect(log).toHaveBeenCalledWith("Auth link invalidation failed", {
      operation: "magic",
      sqlState: "42883",
    });
    expect(log.mock.calls.flat().join(" ")).not.toContain(databaseError.message);
  });
});
