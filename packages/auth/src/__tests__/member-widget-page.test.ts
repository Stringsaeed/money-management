import { describe, expect, it } from "vitest";

import {
  WIDGET_RETURN_LINK,
  buildWidgetPageUrl,
  parseWidgetFragment,
  renderMemberWidgetPage,
  widgetPageSecurityHeaders,
} from "../member-widget-page";

describe("member widget handoff page", () => {
  it("carries the handoff code only in the URL fragment", () => {
    const url = buildWidgetPageUrl("https://api.trove.ing/", "abc/def+ghi");
    expect(url).toBe("https://api.trove.ing/widgets/members#code=abc%2Fdef%2Bghi");
    expect(new URL(url).search).toBe("");
    expect(parseWidgetFragment(new URL(url).hash)).toBe("abc/def+ghi");
    expect(parseWidgetFragment("#")).toBeNull();
    expect(parseWidgetFragment("#code=")).toBeNull();
  });

  it("renders a page that erases the fragment, exchanges once, and links back to the app", () => {
    const html = renderMemberWidgetPage("nonce-1");
    expect(html).toContain('history.replaceState(null, "", location.pathname)');
    expect(html).toContain('fetch("/widgets/session"');
    expect(html).toContain(`href="${WIDGET_RETURN_LINK}"`);
    expect(html).toContain('<script type="module" nonce="nonce-1">');
    expect(html).not.toMatch(/authToken=/);
  });

  it("locks the page down with a nonce-bound CSP and no referrer leakage", () => {
    const headers = widgetPageSecurityHeaders("nonce-1");
    expect(headers["Content-Security-Policy"]).toContain(
      "script-src 'nonce-nonce-1' https://esm.sh",
    );
    expect(headers["Content-Security-Policy"]).toContain(
      "connect-src 'self' https://api.workos.com",
    );
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(headers["Referrer-Policy"]).toBe("no-referrer");
    expect(headers["Cache-Control"]).toBe("no-store");
  });
});
