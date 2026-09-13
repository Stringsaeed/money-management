import {
  TROVE_APP_IDENTITY,
  buildAppleAppSiteAssociation,
  buildAssetLinks,
  parseCertFingerprints,
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

appLinks.get("/.well-known/apple-app-site-association", (c) =>
  c.body(AASA_BODY, 200, ASSOCIATION_HEADERS),
);
appLinks.get("/apple-app-site-association", (c) => c.body(AASA_BODY, 200, ASSOCIATION_HEADERS));
appLinks.get("/.well-known/assetlinks.json", (c) =>
  c.body(ASSETLINKS_BODY, 200, ASSOCIATION_HEADERS),
);
