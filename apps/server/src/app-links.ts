import {
  TROVE_APP_IDENTITY,
  buildAppleAppSiteAssociation,
  buildAssetLinks,
  parseCertFingerprints,
  parseOpenInAppRequest,
  renderOpenInAppPage,
} from "@trove/auth/app-association";
import { env } from "@trove/env/server";
import { Hono } from "hono";

export const appLinks = new Hono();

const AASA_BODY = JSON.stringify(buildAppleAppSiteAssociation(TROVE_APP_IDENTITY));
const ASSETLINKS_BODY = JSON.stringify(
  buildAssetLinks(
    TROVE_APP_IDENTITY,
    parseCertFingerprints(env.ANDROID_CERT_FINGERPRINTS, (bad) =>
      console.warn("[AppLinks] ignoring malformed ANDROID_CERT_FINGERPRINTS entry", {
        length: bad.length,
      }),
    ),
  ),
);

const ASSOCIATION_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=3600",
} as const;

const PAGE_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
} as const;

appLinks.get("/.well-known/apple-app-site-association", (c) =>
  c.body(AASA_BODY, 200, ASSOCIATION_HEADERS),
);
appLinks.get("/apple-app-site-association", (c) => c.body(AASA_BODY, 200, ASSOCIATION_HEADERS));
appLinks.get("/.well-known/assetlinks.json", (c) =>
  c.body(ASSETLINKS_BODY, 200, ASSOCIATION_HEADERS),
);

appLinks.get("/l/:kind", (c) => {
  const parsed = parseOpenInAppRequest(c.req.param("kind"), c.req.query("token") ?? null);
  if (!parsed.ok) {
    const message =
      parsed.reason === "unknown_kind"
        ? "This link is not valid. Open the link from your email again."
        : "This link is incomplete. Open the link from your email again.";
    return c.text(message, 400, { "Cache-Control": "no-store" });
  }
  return c.body(renderOpenInAppPage(parsed.request, TROVE_APP_IDENTITY), 200, PAGE_HEADERS);
});
