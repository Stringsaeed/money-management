import { LINK_TTL_SECONDS } from "./link-policy";
import type { AuthLinkKind } from "./links";

/** Native identity of the Trove app. Must match apps/mobile/app.config.ts + eas.json. */
export interface AppIdentity {
  readonly appleTeamId: string;
  readonly iosBundleId: string;
  readonly androidPackage: string;
  readonly appStoreId?: string;
}

export const TROVE_APP_IDENTITY: AppIdentity = {
  appleTeamId: "V3HN8HXZYK",
  iosBundleId: "com.stringsaeed.moneymanagement",
  androidPackage: "com.stringsaeed.moneymanagement",
  appStoreId: "6799272091",
};

/** Paths Universal Links / App Links claim. Same two `buildEmailLink` emits. */
export const AUTH_LINK_PATHS = ["/l/magic", "/l/reset"] as const;

export interface AppleAppSiteAssociation {
  readonly applinks: {
    readonly details: readonly {
      readonly appIDs: readonly string[];
      readonly components: readonly { readonly "/": string; readonly comment?: string }[];
    }[];
  };
  readonly webcredentials?: { readonly apps: readonly string[] };
}

export function buildAppleAppSiteAssociation(identity: AppIdentity): AppleAppSiteAssociation {
  const appId = `${identity.appleTeamId}.${identity.iosBundleId}`;
  return {
    applinks: {
      details: [
        {
          appIDs: [appId],
          components: AUTH_LINK_PATHS.map((path) => ({
            "/": path,
            comment: path === "/l/magic" ? "Magic sign-in from email" : "Password reset from email",
          })),
        },
      ],
    },
    webcredentials: { apps: [appId] },
  };
}

export interface AssetLinkStatement {
  readonly relation: readonly ["delegate_permission/common.handle_all_urls"];
  readonly target: {
    readonly namespace: "android_app";
    readonly package_name: string;
    readonly sha256_cert_fingerprints: readonly string[];
  };
}

const FINGERPRINT_HEX_LENGTH = 64;

/**
 * Parses a comma/whitespace-separated list of SHA-256 fingerprints.
 * Normalises to upper-case `AA:BB:…` (32 octets) and drops malformed entries
 * instead of throwing — a typo in .env must never take the Worker down.
 */
export function parseCertFingerprints(
  raw: string | undefined,
  onReject?: (entry: string) => void,
): readonly string[] {
  if (raw == null || raw.trim() === "") {
    return [];
  }

  const seen = new Set<string>();
  const fingerprints: string[] = [];

  for (const entry of raw.split(/[,\s]+/)) {
    if (entry === "") {
      continue;
    }
    const normalized = normalizeFingerprint(entry);
    if (normalized == null) {
      onReject?.(entry);
      continue;
    }
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    fingerprints.push(normalized);
  }

  return fingerprints;
}

function normalizeFingerprint(entry: string): string | null {
  const hex = entry.replaceAll(":", "").toUpperCase();
  if (hex.length !== FINGERPRINT_HEX_LENGTH || !/^[0-9A-F]+$/.test(hex)) {
    return null;
  }

  const pairs: string[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    pairs.push(hex.slice(i, i + 2));
  }
  return pairs.join(":");
}

/** Returns `[]` (no statements) when `fingerprints` is empty. */
export function buildAssetLinks(
  identity: AppIdentity,
  fingerprints: readonly string[],
): readonly AssetLinkStatement[] {
  if (fingerprints.length === 0) {
    return [];
  }

  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: identity.androidPackage,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ];
}

export interface OpenInAppRequest {
  readonly kind: AuthLinkKind;
  readonly token: string;
}

export type OpenInAppParse =
  | { readonly ok: true; readonly request: OpenInAppRequest }
  | { readonly ok: false; readonly reason: "unknown_kind" | "missing_token" };

export function parseOpenInAppRequest(kindSegment: string, token: string | null): OpenInAppParse {
  if (kindSegment !== "magic" && kindSegment !== "reset") {
    return { ok: false, reason: "unknown_kind" };
  }
  if (token == null || token === "") {
    return { ok: false, reason: "missing_token" };
  }
  return { ok: true, request: { kind: kindSegment, token } };
}

/** `trove://l/<kind>?token=…` — the authority-is-`l` form `parseAuthLink` accepts. */
export function buildSchemeLink(kind: AuthLinkKind, token: string): string {
  return `trove://l/${kind}?token=${encodeURIComponent(token)}`;
}

export function renderOpenInAppPage(
  request: OpenInAppRequest,
  identity: AppIdentity,
  options?: { readonly linkTtlMinutes?: number },
): string {
  const schemeLink = buildSchemeLink(request.kind, request.token);
  const ttlMinutes = options?.linkTtlMinutes ?? LINK_TTL_SECONDS / 60;
  const heading = request.kind === "magic" ? "Finish signing in ✨" : "Reset your password 🔑";
  const escapedSchemeLink = escapeHtml(schemeLink);
  const banner =
    identity.appStoreId == null
      ? ""
      : `<meta name="apple-itunes-app" content="app-id=${escapeHtml(identity.appStoreId)}, app-argument=${escapedSchemeLink}">`;
  const storeLink =
    identity.appStoreId == null
      ? ""
      : ` <a href="https://apps.apple.com/app/id${escapeHtml(identity.appStoreId)}">Install Trove</a>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
${banner}
<title>Open in Trove 📒</title>
<style>
  :root { color-scheme: light; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F9F8F6;
    color: #1C1B1A;
    font-family: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
  }
  main { max-width: 28rem; padding: 2rem; text-align: center; }
  h1 {
    margin: 0 0 0.75rem;
    font-family: Newsreader, ui-serif, Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: 1.75rem;
  }
  p { margin: 0 0 1rem; line-height: 1.5; }
  .open {
    display: inline-block;
    padding: 0.75rem 1.25rem;
    border-radius: 999px;
    background: #1C1B1A;
    color: #F9F8F6;
    text-decoration: none;
    font-weight: 600;
  }
  .note { color: #5c5a57; font-size: 0.875rem; }
</style>
</head>
<body>
<main>
  <h1>${heading}</h1>
  <p>This link is meant for the Trove app. Tap below to continue.</p>
  <p><a class="open" href="${escapedSchemeLink}">Open Trove →</a></p>
  <p class="note">Links expire after ${String(ttlMinutes)} minutes. Don't have Trove yet? Install it, then open the email link again.${storeLink}</p>
</main>
</body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
