import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { config } from "dotenv";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Redacted from "effect/Redacted";

import { hyperdriveNameForStage } from "./hyperdrive-name.mjs";

config({ path: "./.env" });
config({ path: "../../apps/server/.env" });

const AUTH_HOSTNAME = "auth.trove.ing";
const REQUIRED_PRODUCTION_CUTOVER_APPROVAL = "issue-173-approved";

function assertProductionCutoverApproved(stage: string, approval: string): void {
  if (stage !== "prod" || approval === REQUIRED_PRODUCTION_CUTOVER_APPROVAL) return;
  throw new Error(
    "Production PlanetScale cutover is blocked. Close #173, finish the D1 export/import parity checks, then set PLANETSCALE_CUTOVER_APPROVED=issue-173-approved.",
  );
}

const metrics = Cloudflare.AnalyticsEngine.Dataset("metrics");

export const server = Cloudflare.Worker(
  "server",
  Effect.gen(function* () {
    const stage = yield* Alchemy.Stage;
    const isProd = stage === "prod";
    const cutoverApproval = yield* Config.string("PLANETSCALE_CUTOVER_APPROVED").pipe(
      Config.withDefault("blocked"),
    );
    const devPort = yield* Config.port("ALCHEMY_DEV_PORT").pipe(Config.withDefault(3000));
    assertProductionCutoverApproved(stage, cutoverApproval);
    const routing = isProd ? { domain: AUTH_HOSTNAME, workersDev: false } : { workersDev: true };
    const hd = yield* Cloudflare.Hyperdrive.Connection("HYPERDRIVE_FRESH", {
      name: hyperdriveNameForStage(stage),
      origin: {
        scheme: "postgresql",
        host: Config.string("PLANETSCALE_HOST").pipe(
          Config.withDefault("aws-us-east-1-3.pg.psdb.cloud"),
        ),
        port: 6432,
        database: Config.string("PLANETSCALE_DATABASE").pipe(Config.withDefault("postgres")),
        user: Config.string("PLANETSCALE_USER"),
        password: Config.redacted("PLANETSCALE_PASSWORD"),
      },
      caching: { disabled: true },
      originConnectionLimit: 15,
    });

    return {
      main: "../../apps/server/src/index.ts",
      ...routing,
      compatibility: {
        flags: ["nodejs_compat"],
      },
      placement: {
        mode: "targeted" as const,
        region: "aws:us-east-1",
      },
      observability: {
        enabled: true,
        headSamplingRate: 1,
        logs: {
          enabled: true,
          invocationLogs: true,
          headSamplingRate: 1,
          persist: true,
        },
      },
      crons: ["0 * * * *"],
      env: {
        HYPERDRIVE_FRESH: hd,
        METRICS: metrics,
        CORS_ORIGIN: Config.string("CORS_ORIGIN"),
        WORKOS_API_KEY: Config.redacted("WORKOS_API_KEY"),
        WORKOS_CLIENT_ID: Config.string("WORKOS_CLIENT_ID"),
        WORKOS_TOKEN_AUDIENCE: Config.string("WORKOS_TOKEN_AUDIENCE").pipe(Config.withDefault("")),
        WORKOS_TOKEN_ISSUER: Config.string("WORKOS_TOKEN_ISSUER").pipe(
          Config.withDefault("https://api.workos.com"),
        ),
        // Custom AuthKit auth domain hostname → access-token `iss` is https://{host}.
        // Without this, jose rejects live tokens with claim_iss while defaulting to api.workos.com.
        WORKOS_AUTH_HOSTNAME: Config.string("WORKOS_AUTH_HOSTNAME").pipe(
          Config.withDefault(AUTH_HOSTNAME),
        ),
        // Signing secret of the WorkOS webhook endpoint that feeds the Membership
        // projection. Empty disables the route (503) rather than accepting
        // unsigned events.
        WORKOS_WEBHOOK_SECRET: Config.redacted("WORKOS_WEBHOOK_SECRET").pipe(
          Config.withDefault(Redacted.make("")),
        ),
        POWERSYNC_URL: Config.string("POWERSYNC_URL"),
        POWERSYNC_JWT_PRIVATE_KEY: Config.redacted("POWERSYNC_JWT_PRIVATE_KEY"),
        POWERSYNC_JWT_KID: Config.string("POWERSYNC_JWT_KID"),
        KILL_SWITCH_LOCAL_ONLY: Config.string("KILL_SWITCH_LOCAL_ONLY").pipe(
          Config.withDefault("off"),
        ),
        ANDROID_CERT_FINGERPRINTS: Config.string("ANDROID_CERT_FINGERPRINTS").pipe(
          Config.withDefault(""),
        ),
      },
      dev: {
        port: devPort,
      },
    };
  }),
);

export type ServerEnv = Cloudflare.InferEnv<typeof server>;

export default Alchemy.Stack(
  "money-management",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const serverWorker = yield* server;

    return {
      server: serverWorker.url,
    };
  }),
);
