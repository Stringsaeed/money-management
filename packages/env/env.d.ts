import type { ServerEnv } from "@trove/infra/alchemy.run";

// This file infers types for the cloudflare:workers environment from the Alchemy Worker.
// @see https://alchemy.run/cloudflare/compute/workers

export type CloudflareEnv = ServerEnv;

declare global {
  type Env = CloudflareEnv;
}

declare module "cloudflare:workers" {
  namespace Cloudflare {
    // oxlint-disable-next-line no-empty-object-type -- module augmentation contract required by cloudflare:workers
    export interface Env extends CloudflareEnv {}
  }
}
