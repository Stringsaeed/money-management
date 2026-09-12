import { describe, expect, it } from "@jest/globals";

import { moveMoneyRequest } from "./assignment-test-support";
import { validateMoveRequest } from "./assignment-validation";
import type { MoveMoneyRequest } from "./types";

const request = (overrides: Partial<MoveMoneyRequest> = {}): MoveMoneyRequest =>
  moveMoneyRequest(overrides) as MoveMoneyRequest;

describe("validateMoveRequest", () => {
  it("returns the current period derived from now for a valid current-period move", () => {
    expect(validateMoveRequest(request())).toBe("2026-08");
  });

  it("rejects past periods unless allowPastPeriod is set", () => {
    expect(() => validateMoveRequest(request({ period: "2026-07" }))).toThrow(
      /current or a future/,
    );
    expect(validateMoveRequest(request({ period: "2026-07" }), { allowPastPeriod: true })).toBe(
      "2026-08",
    );
  });
});
