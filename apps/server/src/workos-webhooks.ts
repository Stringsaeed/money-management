import { createHouseholdDeps } from "@trove/api/lib/households/deps";
import { applyHouseholdEvent } from "@trove/api/lib/membership/reconcile";
import { WebhookVerifyError, parseHouseholdEvent, verifyWorkOSWebhook } from "@trove/auth";
import { env } from "@trove/env/server";
import { Hono } from "hono";

export const workosWebhooks = new Hono();

/**
 * WorkOS webhook receiver feeding the Membership projection. Only events whose
 * signature verifies against `WORKOS_WEBHOOK_SECRET` are applied; the
 * projection's ordering rule makes replays and out-of-order deliveries safe,
 * so WorkOS retries are always answered 2xx once verified.
 */
workosWebhooks.post("/webhooks/workos", async (c) => {
  const secret = env.WORKOS_WEBHOOK_SECRET;
  if (!secret) {
    return c.text("Webhook receiver is disabled: WORKOS_WEBHOOK_SECRET is not configured.", 503, {
      "Cache-Control": "no-store",
    });
  }
  const sigHeader = c.req.header("WorkOS-Signature");
  if (!sigHeader) {
    return c.text("Missing WorkOS-Signature header.", 400);
  }
  const payload = await c.req.text();
  try {
    const event = await verifyWorkOSWebhook({
      apiKey: env.WORKOS_API_KEY,
      payload,
      sigHeader,
      secret,
    });
    const outcome = await applyHouseholdEvent(createHouseholdDeps(), parseHouseholdEvent(event));
    return c.json({ outcome });
  } catch (error) {
    if (error instanceof WebhookVerifyError) {
      return c.text("Signature verification failed.", 401);
    }
    console.error("[WorkOS webhook] projection failed; WorkOS will retry", { error });
    return c.text("Projection failed; retry later.", 500);
  }
});
