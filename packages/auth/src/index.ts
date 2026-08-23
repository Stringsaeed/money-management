import { expo } from "@better-auth/expo";
import { createDb } from "@trove/db";
import * as schema from "@trove/db/schema/auth";
import { env } from "@trove/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export function createAuth() {
  const db = createDb();

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",

      schema: schema,
    }),
    trustedOrigins: [env.CORS_ORIGIN, "trove://", "exp://", "http://localhost:8081"],
    emailAndPassword: {
      enabled: true,
    },
    // Uncomment cookieCache when ready to deploy to Cloudflare using *.workers.dev domains
    // session: {
    //   cookieCache: {
    //     enabled: true,
    //     maxAge: 60,
    //   },
    // },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      // Secure/SameSite=None cookies are rejected over plain HTTP, so relax
      // them whenever the server runs on an http:// base URL (local dev).
      defaultCookieAttributes: {
        sameSite: env.BETTER_AUTH_URL.startsWith("https") ? "none" : "lax",
        secure: env.BETTER_AUTH_URL.startsWith("https"),
        httpOnly: true,
      },
      // Uncomment crossSubDomainCookies when deploying and replace <your-workers-subdomain>
      // https://developers.cloudflare.com/workers/wrangler/configuration/#workersdev
      // crossSubDomainCookies: {
      //   enabled: true,
      //   domain: "<your-workers-subdomain>",
      // },
    },
    plugins: [expo()],
  });
}
