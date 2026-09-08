import { expo } from "@better-auth/expo";
import { createDb } from "@trove/db";
import * as schema from "@trove/db/schema/auth";
import { env } from "@trove/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";

import { invalidatePriorMagicLinks, invalidatePriorResetLinks } from "./invalidate-links";
import { rethrowInvalidationError } from "./invalidation-error";
import { AUTH_PUBLIC_URL, LINK_TTL_SECONDS } from "./link-policy";
import { buildEmailLink } from "./links";
import { consoleMailer, type Mailer } from "./mailer";

export { createEmailMailer, renderAuthEmail } from "./email-mailer";
export { AUTH_LINK_PATHS, TROVE_APP_IDENTITY, buildSchemeLink } from "./app-association";
export { AUTH_PUBLIC_URL, LINK_TTL_SECONDS } from "./link-policy";
export { buildEmailLink } from "./links";
export { consoleMailer, type Mailer } from "./mailer";

export function createAuth(deps: { readonly mailer?: Mailer } = {}) {
  const db = createDb();
  const mailer = deps.mailer ?? consoleMailer;

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",

      schema: schema,
    }),
    trustedOrigins: [
      env.CORS_ORIGIN,
      AUTH_PUBLIC_URL,
      "trove://",
      "exp://",
      "http://localhost:8081",
    ],
    emailAndPassword: {
      enabled: true,
      resetPasswordTokenExpiresIn: LINK_TTL_SECONDS,
      sendResetPassword: async ({ user, token }) => {
        try {
          await invalidatePriorResetLinks(db, user.id, `reset-password:${token}`);
        } catch (error) {
          rethrowInvalidationError(
            "reset",
            error instanceof Error ? error : new Error("Unknown reset-link invalidation failure"),
          );
        }
        await mailer.send(user.email, "reset", buildEmailLink("reset", token, AUTH_PUBLIC_URL));
      },
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
    plugins: [
      expo(),
      magicLink({
        disableSignUp: true,
        expiresIn: LINK_TTL_SECONDS,
        sendMagicLink: async ({ email, token }) => {
          try {
            await invalidatePriorMagicLinks(db, email, token);
          } catch (error) {
            rethrowInvalidationError(
              "magic",
              error instanceof Error ? error : new Error("Unknown magic-link invalidation failure"),
            );
          }
          await mailer.send(email, "magic", buildEmailLink("magic", token, AUTH_PUBLIC_URL));
        },
      }),
    ],
  });
}
