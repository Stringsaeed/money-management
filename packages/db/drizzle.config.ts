import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({
  path: "../../apps/server/.env",
});

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  // D1-HTTP reads CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID and
  // CLOUDFLARE_API_TOKEN from the environment.
  // DOCS: https://orm.drizzle.team/docs/guides/d1-http-with-drizzle-kit
  dialect: "sqlite",
  driver: "d1-http",
});
