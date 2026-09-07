import { createHash } from "node:crypto";

const PRODUCTION_HYPERDRIVE_NAME = "trove-ledger-fresh";
const NON_PRODUCTION_PREFIX = `${PRODUCTION_HYPERDRIVE_NAME}-`;

export function hyperdriveNameForStage(stage) {
  if (stage === "prod") return PRODUCTION_HYPERDRIVE_NAME;
  const digest = createHash("sha256").update(stage).digest("hex").slice(0, 13);
  return `${NON_PRODUCTION_PREFIX}${digest}`;
}
