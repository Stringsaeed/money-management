interface ExpoClientManifest {
  extra?: {
    ota?: {
      mandatory?: unknown;
    };
  };
}

interface UpdateManifest {
  extra?: {
    expoClient?: ExpoClientManifest;
  };
}

export function isMandatoryUpdateManifest(manifest: unknown): boolean {
  if (!manifest || typeof manifest !== "object" || !("extra" in manifest)) {
    return false;
  }

  const updateManifest = manifest as UpdateManifest;

  return updateManifest.extra?.expoClient?.extra?.ota?.mandatory === true;
}
