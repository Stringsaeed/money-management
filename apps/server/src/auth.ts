import { consoleMailer, createAuth, createEmailMailer } from "@trove/auth";
import { env } from "@trove/env/server";

const mailer = env.BETTER_AUTH_URL.startsWith("https")
  ? createEmailMailer(env.EMAIL, { from: "noreply@trove.ing" })
  : consoleMailer;

export function createServerAuth() {
  return createAuth({ mailer });
}
