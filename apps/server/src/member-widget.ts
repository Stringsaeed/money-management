import { createHouseholdDeps } from "@trove/api/lib/households/deps";
import { exchangeWidgetHandoff } from "@trove/api/lib/households/service";
import {
  WIDGET_PAGE_PATH,
  WIDGET_SESSION_PATH,
  renderMemberWidgetPage,
  widgetPageSecurityHeaders,
} from "@trove/auth";
import { Hono } from "hono";
import { z } from "zod";

export const memberWidget = new Hono();

const sessionBody = z.object({ code: z.string().min(16).max(128) });

function nonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

memberWidget.get(WIDGET_PAGE_PATH, (c) => {
  const pageNonce = nonce();
  return c.body(renderMemberWidgetPage(pageNonce), 200, widgetPageSecurityHeaders(pageNonce));
});

/** Exchanges a single-use handoff code for a widget token; the code is the only input. */
memberWidget.post(WIDGET_SESSION_PATH, async (c) => {
  const parsed = sessionBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "A handoff code is required." }, 400);
  }
  const session = await exchangeWidgetHandoff(createHouseholdDeps(), parsed.data.code);
  if (!session) {
    return c.json({ error: "This code is invalid, expired, or already used." }, 401, {
      "Cache-Control": "no-store",
    });
  }
  return c.json(session, 200, { "Cache-Control": "no-store" });
});
