import { describe, expect, it } from "vitest";

import { WIDGET_RETURN_LINK } from "./member-widget-page";

describe("WIDGET_RETURN_LINK", () => {
  it("locks the widget return deep link", () => {
    expect(WIDGET_RETURN_LINK).toBe("trove://widget-return");
  });
});
