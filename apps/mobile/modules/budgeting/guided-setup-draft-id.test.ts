import { describe, expect, it } from "@jest/globals";

import { GUIDED_SETUP_DRAFT_ID } from "./setup-draft-types";

describe("GUIDED_SETUP_DRAFT_ID", () => {
  it("locks the guided envelope setup draft id", () => {
    expect(GUIDED_SETUP_DRAFT_ID).toBe("guided-envelope-setup");
  });
});
