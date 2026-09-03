import type { AuthLinkKind } from "./links";

export interface Mailer {
  send(to: string, kind: AuthLinkKind, url: string): Promise<void>;
}

export const consoleMailer: Mailer = {
  async send(to, kind, url) {
    const label = kind === "magic" ? "Magic link" : "Reset password link";
    console.log(`[Auth] ${label} for ${to}: ${url}`);
  },
};
