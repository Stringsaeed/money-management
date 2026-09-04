import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { config } from "dotenv";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";

config({ path: "./.env" });
config({ path: "../../apps/server/.env" });

export const db = Cloudflare.D1.Database("database", {
  migrationsDir: "../../packages/db/src/migrations",
});

const metrics = Cloudflare.AnalyticsEngine.Dataset("metrics");

export const server = Cloudflare.Worker("server", {
  main: "../../apps/server/src/index.ts",
  domain: "auth.trove.ing",
  compatibility: {
    flags: ["nodejs_compat"],
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
    DB: db,
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
    // Remote kill switch (#99). Env var over KV on purpose: the stack binds
    // no KV namespace today and the flag is a single coarse toggle — flip it
    // with `alchemy deploy` after changing KILL_SWITCH_LOCAL_ONLY in
    // packages/infra/.env, or edit the Worker variable in the dashboard.
    KILL_SWITCH_LOCAL_ONLY: Config.string("KILL_SWITCH_LOCAL_ONLY").pipe(Config.withDefault("off")),
    // Comma-separated SHA-256 signing cert fingerprints for Android App Links
    // (upload key and/or Play App Signing key). Empty = serve an assetlinks
    // document with no statements; Android then opens /l/* in the browser.
    ANDROID_CERT_FINGERPRINTS: Config.string("ANDROID_CERT_FINGERPRINTS").pipe(
      Config.withDefault(""),
    ),
  },
  dev: {
    port: 3000,
  },
});

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
