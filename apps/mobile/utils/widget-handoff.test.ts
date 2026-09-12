import { describe, expect, it } from "@jest/globals";

import { buildWidgetPageUrl } from "./widget-handoff";

describe("buildWidgetPageUrl", () => {
  it("strips trailing slashes and embeds the members fragment code", () => {
    expect(buildWidgetPageUrl("https://auth.example.com/", "abc 123")).toBe(
      "https://auth.example.com/widgets/members#code=abc%20123",
    );
  });

  it("encodes special characters in the handoff code", () => {
    expect(buildWidgetPageUrl("https://auth.example.com", "a&b=c")).toBe(
      "https://auth.example.com/widgets/members#code=a%26b%3Dc",
    );
  });
});
