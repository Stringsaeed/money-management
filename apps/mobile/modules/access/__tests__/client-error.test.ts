import { describe, expect, it } from "@jest/globals";

import { authFailureFromClient } from "../client-error";

describe("auth client failures", () => {
  it("maps an existing-profile signup response to an actionable failure", () => {
    expect(
      authFailureFromClient({
        status: 422,
        code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
        message: "User already exists. Use another email.",
      }),
    ).toEqual({ kind: "account_exists" });
  });

  it("maps invalid email responses separately from server failures", () => {
    expect(authFailureFromClient({ status: 400, code: "INVALID_EMAIL" })).toEqual({
      kind: "invalid_email",
    });
    expect(
      authFailureFromClient({
        status: 400,
        code: "VALIDATION_ERROR",
        message: "[body.email] Invalid input",
      }),
    ).toEqual({ kind: "invalid_email" });
    expect(
      authFailureFromClient({
        status: 400,
        code: "VALIDATION_ERROR",
        message: "[body.password] Invalid input",
      }),
    ).toEqual({ kind: "invalid_input" });
  });
});
