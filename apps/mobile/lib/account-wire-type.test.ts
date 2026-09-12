import { describe, expect, it } from "@jest/globals";

import { toWireAccountType } from "./account-wire-type";

describe("toWireAccountType", () => {
  it("maps cash to cash", () => {
    expect(toWireAccountType("cash")).toBe("cash");
  });

  it("maps credit_card to card", () => {
    expect(toWireAccountType("credit_card")).toBe("card");
  });

  it("maps all other product types to bank", () => {
    expect(toWireAccountType("checking")).toBe("bank");
    expect(toWireAccountType("savings")).toBe("bank");
    expect(toWireAccountType("bank")).toBe("bank");
  });
});
