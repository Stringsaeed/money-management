import { afterEach, describe, expect, it, vi } from "vitest";

import { createEmailMailer, renderAuthEmail, type EmailSender } from "./email-mailer";

const magicUrl = "https://auth.trove.ing/l/magic?token=x";
const resetUrl = "https://auth.trove.ing/l/reset?token=y";

const recordSender = (sent: EmailMessageBuilder[]): EmailSender => ({
  send: async (message) => {
    if (!("subject" in message)) {
      throw new Error("expected structured email");
    }
    sent.push(message);
    return { messageId: "test" };
  },
});

describe("renderAuthEmail", () => {
  it("renders magic-link subject, text, and html with the url", () => {
    const content = renderAuthEmail("magic", magicUrl);
    expect(content.subject).toBe("Sign in to Trove");
    expect(content.text).toContain(magicUrl);
    expect(content.html).toContain(magicUrl);
  });

  it("renders reset-password subject, text, and html with the url", () => {
    const content = renderAuthEmail("reset", resetUrl);
    expect(content.subject).toBe("Reset your Trove password");
    expect(content.text).toContain(resetUrl);
    expect(content.html).toContain(resetUrl);
  });
});

describe("createEmailMailer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends magic mail from Trove at noreply@trove.ing", async () => {
    const sent: EmailMessageBuilder[] = [];
    const mailer = createEmailMailer(recordSender(sent), { from: "noreply@trove.ing" });

    await mailer.send("a@b.c", "magic", magicUrl);

    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      to: "a@b.c",
      from: { email: "noreply@trove.ing", name: "Trove" },
      subject: "Sign in to Trove",
    });
    expect(sent[0]?.text).toContain(magicUrl);
    expect(sent[0]?.html).toContain(magicUrl);
  });

  it("sends reset mail with the reset subject and url", async () => {
    const sent: EmailMessageBuilder[] = [];
    const mailer = createEmailMailer(recordSender(sent), { from: "noreply@trove.ing" });

    await mailer.send("a@b.c", "reset", resetUrl);

    expect(sent[0]).toMatchObject({
      to: "a@b.c",
      from: { email: "noreply@trove.ing", name: "Trove" },
      subject: "Reset your Trove password",
    });
    expect(sent[0]?.text).toContain(resetUrl);
    expect(sent[0]?.html).toContain(resetUrl);
  });

  it("logs without the recipient and rethrows when send fails", async () => {
    const error = new Error("sender not verified");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const mailer = createEmailMailer(
      {
        send: async () => {
          throw error;
        },
      },
      { from: "noreply@trove.ing" },
    );

    await expect(mailer.send("secret@trove.ing", "magic", magicUrl)).rejects.toBe(error);

    expect(consoleError).toHaveBeenCalledWith("[Auth] email send failed", { kind: "magic", error });
    const logged = JSON.stringify(consoleError.mock.calls);
    expect(logged).not.toContain("secret@trove.ing");
  });
});
