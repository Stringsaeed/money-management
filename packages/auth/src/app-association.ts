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

export interface AppleAppSiteAssociation {
  readonly applinks: {
    readonly details: readonly {
      readonly appIDs: readonly string[];
      readonly components: readonly { readonly "/": string; readonly comment?: string }[];
    }[];
  };
  readonly webcredentials?: { readonly apps: readonly string[] };
}

/** WorkOS AuthKit passkeys / password manager association — no magic-link paths. */
export function buildAppleAppSiteAssociation(identity: AppIdentity): AppleAppSiteAssociation {
  const appId = `${identity.appleTeamId}.${identity.iosBundleId}`;
  return {
    applinks: { details: [] },
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
