/// <reference types="@cloudflare/workers-types" />
/// <reference path="../env.d.ts" />
// On Cloudflare Workers, env is accessed via the cloudflare:workers module.
// Types are inferred from the Alchemy worker bindings in packages/infra.
export { env } from "cloudflare:workers";
