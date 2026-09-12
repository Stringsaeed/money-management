import { describe, expect, it } from "@jest/globals";
import { Platform } from "react-native";

import { fieldTextStyle } from "./field-style";

describe("fieldTextStyle", () => {
  it("locks Paper Ledger body-medium typography at 15/20 with the given ink", () => {
    expect(fieldTextStyle("#1C1B1A")).toEqual({
      fontFamily: Platform.OS === "ios" ? "Nunito-Medium" : "Nunito_500Medium",
      fontSize: 15,
      lineHeight: 20,
      color: "#1C1B1A",
    });
  });
});
