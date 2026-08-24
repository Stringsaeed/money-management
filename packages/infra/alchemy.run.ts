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

// Observability metrics (#99): one Analytics Engine dataset receiving
// latency samples + error events via writeDataPoint. Percentiles (p50/p95/
// p99) are computed with AE SQL at query time — see docs/architecture/
// observability.md.
const metrics = Cloudflare.AnalyticsEngine.Dataset("metrics");

export const server = Cloudflare.Worker("server", {
  main: "../../apps/server/src/index.ts",
  compatibility: {
    flags: ["nodejs_compat"],
  },
  // Workers Logs: persisted invocation logs + console output power the
  // dashboard in docs/architecture/observability.md.
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
  // Hourly settlement sweep (#88): the entry module's exported `scheduled`
  // handler runs settleDueRules; safe under retries (occurrence-PK guard).
  crons: ["0 * * * *"],
  env: {
    DB: db,
    // Per-household realtime push (#93): one WebSocket-holding DO instance
    // per household, addressed with idFromName(householdId).
    PUSH_HOUSEHOLD_DO: Cloudflare.DurableObject("PUSH_HOUSEHOLD_DO", {
      className: "HouseholdPushDO",
    }),
    METRICS: metrics,
    CORS_ORIGIN: Config.string("CORS_ORIGIN"),
    BETTER_AUTH_SECRET: Config.redacted("BETTER_AUTH_SECRET"),
    BETTER_AUTH_URL: Cloudflare.Worker.URL,
    SETTLEMENT_ADMIN_SECRET: Config.redacted("SETTLEMENT_ADMIN_SECRET"),
    // Remote kill switch (#99). Env var over KV on purpose: the stack binds
    // no KV namespace today and the flag is a single coarse toggle — flip it
    // with `alchemy deploy` after changing KILL_SWITCH_LOCAL_ONLY in
    // packages/infra/.env, or edit the Worker variable in the dashboard.
    KILL_SWITCH_LOCAL_ONLY: Config.string("KILL_SWITCH_LOCAL_ONLY").pipe(Config.withDefault("off")),
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
