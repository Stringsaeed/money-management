/// <reference types="@cloudflare/workers-types" />
/// <reference path="../env.d.ts" />
// On Cloudflare Workers, env is accessed via the cloudflare:workers module.
// Types are inferred from the Alchemy worker bindings in packages/infra.
import { env } from "cloudflare:workers";

export { env };

export interface PowerSyncServerConfig {
  readonly audience: string;
  readonly kid: string;
  readonly privateKey: string;
}

export function getPowerSyncServerConfig(): PowerSyncServerConfig {
  return {
    audience: env.POWERSYNC_URL,
    kid: env.POWERSYNC_JWT_KID,
    privateKey: env.POWERSYNC_JWT_PRIVATE_KEY,
  };
}
