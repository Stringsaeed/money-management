import { describe, expect, it } from "@jest/globals";

import {
  ACCOUNT_TYPE_META,
  ACCOUNT_TYPE_OPTIONS,
} from "./account-form-options";

describe("ACCOUNT_TYPE_META", () => {
  it("indexes ACCOUNT_TYPE_OPTIONS by value", () => {
    expect(Object.keys(ACCOUNT_TYPE_META).sort()).toEqual(
      ACCOUNT_TYPE_OPTIONS.map((option) => option.value).sort(),
    );

    for (const option of ACCOUNT_TYPE_OPTIONS) {
      expect(ACCOUNT_TYPE_META[option.value]).toEqual(option);
    }
  });
});
