import { describe, expect, it } from "vitest";

import { TROVE_APP_IDENTITY } from "./app-association";

describe("TROVE_APP_IDENTITY", () => {
  it("locks the native Trove app identity vocabulary", () => {
    expect(TROVE_APP_IDENTITY).toEqual({
      appleTeamId: "V3HN8HXZYK",
      iosBundleId: "com.stringsaeed.moneymanagement",
      androidPackage: "com.stringsaeed.moneymanagement",
      appStoreId: "6799272091",
    });
  });
});
