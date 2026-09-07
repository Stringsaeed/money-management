const PRODUCTION_HYPERDRIVE_NAME = "trove-ledger-fresh";
const NON_PRODUCTION_PREFIX = `${PRODUCTION_HYPERDRIVE_NAME}-`;

export function hyperdriveNameForStage(stage) {
  if (stage === "prod") return PRODUCTION_HYPERDRIVE_NAME;
  const slug =
    stage
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, "-")
      .replaceAll(/^-|-$/g, "")
      .slice(0, 4) || "dev";
  return `${NON_PRODUCTION_PREFIX}${slug}-${fnv1a(stage)}`;
}

function fnv1a(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
