import { describe, expect, it } from "@jest/globals";

import { DB_NAME } from "./constants";

describe("DB_NAME", () => {
  it('locks on-device SQLite filename to "money.db"', () => {
    expect(DB_NAME).toBe("money.db");
  });
});
