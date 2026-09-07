import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { config } from "dotenv";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";

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
        PUSH_HOUSEHOLD_DO: Cloudflare.DurableObject("PUSH_HOUSEHOLD_DO", {
          className: "HouseholdPushDO",
        }),
        METRICS: metrics,
        CORS_ORIGIN: Config.string("CORS_ORIGIN"),
        BETTER_AUTH_SECRET: Config.redacted("BETTER_AUTH_SECRET"),
        BETTER_AUTH_URL: Cloudflare.Worker.URL,
        EMAIL: Cloudflare.Email.SendEmail("EMAIL", {
          allowedSenderAddresses: ["noreply@trove.ing"],
        }),
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
