/**
 * The member-management web page: a small authenticated surface that hosts
 * the WorkOS User Management widget for Household admins.
 *
 * Handoff contract (#228):
 * - The app opens `/widgets/members#code=<single-use code>`. The code rides
 *   in the URL fragment, which browsers never send to the server or in
 *   Referer headers, and the page erases it from history before doing
 *   anything else.
 * - The page exchanges the code once at `POST /widgets/session`; the server
 *   answers with a widget token bound to the admin's WorkOS user and
 *   Organization. No reusable credential is ever placed in a URL.
 * - "Back to Trove" returns through the app scheme.
 */

export const WIDGET_PAGE_PATH = "/widgets/members";
export const WIDGET_SESSION_PATH = "/widgets/session";
export const WIDGET_RETURN_LINK = "trove://widget-return";

const ESM_ORIGIN = "https://esm.sh";
const WORKOS_API_ORIGIN = "https://api.workos.com";

const WIDGETS_MODULE = `${ESM_ORIGIN}/@workos-inc/widgets@1?deps=react@18.3.1,react-dom@18.3.1`;
const REACT_MODULE = `${ESM_ORIGIN}/react@18.3.1`;
const REACT_DOM_MODULE = `${ESM_ORIGIN}/react-dom@18.3.1/client`;
const WIDGETS_STYLES = `${ESM_ORIGIN}/@workos-inc/widgets@1/styles.css`;

/** Fragment-based handoff URL the app opens in the system browser. */
export function buildWidgetPageUrl(serverUrl: string, code: string): string {
  return `${serverUrl.replace(/\/+$/, "")}${WIDGET_PAGE_PATH}#code=${encodeURIComponent(code)}`;
}

/** Reads the code out of a fragment the way the page script does; exported for tests. */
export function parseWidgetFragment(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const code = params.get("code");
  return code && code.trim().length > 0 ? code : null;
}

export function widgetPageSecurityHeaders(nonce: string) {
  return {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex, nofollow",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": [
      "default-src 'none'",
      `script-src 'nonce-${nonce}' ${ESM_ORIGIN}`,
      `style-src 'unsafe-inline' ${ESM_ORIGIN}`,
      `connect-src 'self' ${WORKOS_API_ORIGIN} ${ESM_ORIGIN}`,
      "img-src https: data:",
      `font-src ${ESM_ORIGIN} data:`,
      "base-uri 'none'",
      "form-action 'none'",
      "frame-ancestors 'none'",
    ].join("; "),
  } as const;
}

export function renderMemberWidgetPage(nonce: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Household members · Trove</title>
<link rel="stylesheet" href="${WIDGETS_STYLES}">
<style>
  :root { color-scheme: light; }
  body { margin: 0; background: #F9F8F6; color: #1C1B1A; font-family: -apple-system, "Plus Jakarta Sans", system-ui, sans-serif; }
  header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #EBE8E3; }
  h1 { margin: 0; font: italic 500 20px/1.2 Georgia, "Newsreader", serif; }
  a.back { color: #1C1B1A; text-decoration: none; font-weight: 600; }
  main { padding: 20px; max-width: 960px; margin: 0 auto; }
  .status { padding: 24px; background: #F1F0EE; border-radius: 12px; }
</style>
</head>
<body>
<header>
  <h1 id="title">Household members 👥</h1>
  <a class="back" href="${WIDGET_RETURN_LINK}">← Back to Trove</a>
</header>
<main>
  <div id="root"><p class="status" id="status">Opening member management…</p></div>
</main>
<script type="module" nonce="${nonce}">
const params = new URLSearchParams(location.hash.replace(/^#/, ""));
const code = params.get("code");
history.replaceState(null, "", location.pathname);
const status = document.getElementById("status");
const fail = (message) => { status.textContent = message; };
if (!code) {
  fail("This link is incomplete. Open Members again from the Trove app.");
} else {
  try {
    const response = await fetch(${JSON.stringify(WIDGET_SESSION_PATH)}, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      credentials: "omit",
    });
    if (!response.ok) {
      fail("This link has expired or was already used. Open Members again from the Trove app.");
    } else {
      const session = await response.json();
      document.getElementById("title").textContent = session.householdName + " 👥";
      const [React, { createRoot }, widgets] = await Promise.all([
        import(${JSON.stringify(REACT_MODULE)}),
        import(${JSON.stringify(REACT_DOM_MODULE)}),
        import(${JSON.stringify(WIDGETS_MODULE)}),
      ]);
      const h = React.createElement;
      createRoot(document.getElementById("root")).render(
        h(widgets.WorkOsWidgets, null, h(widgets.UsersManagement, { authToken: session.token })),
      );
    }
  } catch (error) {
    console.error(error);
    fail("Member management could not load. Check your connection and open Members again from the Trove app.");
  }
}
</script>
</body>
</html>
`;
}
