import { describe, expect, it } from "@jest/globals";

import { AUTH_FONT_FACES } from "./tokens";

describe("AUTH_FONT_FACES", () => {
  it("locks Nunito face names for 400/500/600 weights", () => {
    expect(AUTH_FONT_FACES).toEqual({
      "400": { ios: "Nunito-Regular", android: "Nunito_400Regular", web: "Nunito_400Regular" },
      "500": { ios: "Nunito-Medium", android: "Nunito_500Medium", web: "Nunito_500Medium" },
      "600": { ios: "Nunito-SemiBold", android: "Nunito_600SemiBold", web: "Nunito_600SemiBold" },
    });
  });
});
