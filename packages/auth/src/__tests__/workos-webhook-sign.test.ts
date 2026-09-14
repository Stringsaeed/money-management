import { createHmac } from "node:crypto";
import { WorkOS } from "@workos-inc/node";
import { describe, expect, it } from "vitest";

import { signWorkOSWebhookPayload } from "../workos-webhook-sign";

describe("signWorkOSWebhookPayload", () => {
  it("produces a header WorkOS constructEvent accepts", async () => {
    const secret = "whsec_cert232_fixture_secret_do_not_use_in_prod";
    const payload = JSON.stringify({
      id: "event_cert232_fixture",
      event: "user.updated",
      created_at: "2026-09-12T20:00:00.000Z",
      data: { id: "user_cert232probe_fixture" },
    });
    const timestampMs = Date.now();
    const header = signWorkOSWebhookPayload({ payload, secret, timestampMs });
    expect(header).toBe(
      `t=${timestampMs},v1=${createHmac("sha256", secret).update(`${timestampMs}.${payload}`, "utf8").digest("hex")}`,
    );

    const workos = new WorkOS("sk_test_unused_for_signature_only");
    const event = await workos.webhooks.constructEvent({
      payload,
      sigHeader: header,
      secret,
      tolerance: 180_000,
    });
    expect(event.id).toBe("event_cert232_fixture");
    expect(event.event).toBe("user.updated");
  });
});
