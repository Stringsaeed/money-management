import { consoleMailer, createAuth, createEmailMailer } from "@trove/auth";
import { env } from "@trove/env/server";

// Same https discriminator as cookie Secure/SameSite: local http keeps
// console links; deployed https uses the Email Sending binding.
const mailer = env.BETTER_AUTH_URL.startsWith("https")
  ? createEmailMailer(env.EMAIL, { from: "noreply@trove.ing" })
  : consoleMailer;

export const auth = createAuth({ mailer });
