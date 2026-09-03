import type { AuthLinkKind } from "./links";
import type { Mailer } from "./mailer";

/** Structural subset of the Workers `SendEmail` binding so tests can pass a fake. */
export type EmailSender = Pick<SendEmail, "send">;

export interface EmailMailerOptions {
  readonly from: string;
  readonly fromName?: string;
}

export interface AuthEmailContent {
  readonly subject: string;
  readonly text: string;
  readonly html: string;
}

export function renderAuthEmail(kind: AuthLinkKind, url: string): AuthEmailContent {
  if (kind === "magic") {
    return {
      subject: "Sign in to Trove",
      text: `Sign in to Trove with this link:\n\n${url}\n\nThis link expires in 15 minutes. If you did not request it, you can ignore this email.`,
      html: `<p>Sign in to Trove with this link:</p><p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p><p>This link expires in 15 minutes. If you did not request it, you can ignore this email.</p>`,
    };
  }

  return {
    subject: "Reset your Trove password",
    text: `Reset your Trove password with this link:\n\n${url}\n\nThis link expires in 15 minutes. If you did not request it, you can ignore this email.`,
    html: `<p>Reset your Trove password with this link:</p><p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p><p>This link expires in 15 minutes. If you did not request it, you can ignore this email.</p>`,
  };
}

export function createEmailMailer(email: EmailSender, options: EmailMailerOptions): Mailer {
  const fromName = options.fromName ?? "Trove";

  return {
    async send(to, kind, url) {
      const content = renderAuthEmail(kind, url);
      try {
        await email.send({
          to,
          from: { email: options.from, name: fromName },
          ...content,
        });
      } catch (error) {
        console.error("[Auth] email send failed", { kind, error });
        throw error;
      }
    },
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
