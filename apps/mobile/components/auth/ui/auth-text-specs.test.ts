import { describe, expect, it } from "@jest/globals";

import { AUTH_TEXT_SPECS } from "./roles";

describe("AUTH_TEXT_SPECS", () => {
  it("locks title through notice auth text vocabulary", () => {
    expect(AUTH_TEXT_SPECS).toEqual({
      title: { color: "--color-ink", weight: "500", size: 36, letterSpacing: -0.9, italic: true },
      subtitle: { color: "--color-muted-foreground", weight: "400", size: 14 },
      note: { color: "--color-muted-foreground", weight: "400", size: 13 },
      "notice-error": { color: "--color-destructive", weight: "400", size: 13 },
      "notice-success": { color: "--color-sage", weight: "500", size: 13 },
    });
  });
});
