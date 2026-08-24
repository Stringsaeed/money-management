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

export const server = Cloudflare.Worker("server", {
  main: "../../apps/server/src/index.ts",
  compatibility: {
    flags: ["nodejs_compat"],
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
    CORS_ORIGIN: Config.string("CORS_ORIGIN"),
    BETTER_AUTH_SECRET: Config.redacted("BETTER_AUTH_SECRET"),
    BETTER_AUTH_URL: Cloudflare.Worker.URL,
    SETTLEMENT_ADMIN_SECRET: Config.redacted("SETTLEMENT_ADMIN_SECRET"),
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
