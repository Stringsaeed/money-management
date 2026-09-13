#!/usr/bin/env node
/**
 * Cert probe (#232): sign disposable WorkOS membership events with
 * WORKOS_WEBHOOK_SECRET and POST them to the live webhook receiver.
 * Never prints secret values. Intended for GitHub Actions workflow_dispatch.
 */
import { createHmac } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const WEBHOOK_URL = process.env.WORKOS_WEBHOOK_URL ?? "https://auth.trove.ing/webhooks/workos";
const OUT_DIR = process.env.PROBE_OUT_DIR ?? "artifacts/workos-webhook-signed-probe";

function requireWorkOSSecrets() {
  const secret = process.env.WORKOS_WEBHOOK_SECRET;
  const apiKey = process.env.WORKOS_API_KEY;
  if (!secret) {
    console.error("HARD STOP: WORKOS_WEBHOOK_SECRET is empty or unset. Do not invent secrets.");
    process.exit(2);
  }
  if (!apiKey) {
    console.error("HARD STOP: WORKOS_API_KEY is empty or unset. Do not invent secrets.");
    process.exit(2);
  }
  return { secret, apiKey };
}

function sign(payload, secret, timestampMs = Date.now()) {
  const signatureHash = createHmac("sha256", secret)
    .update(`${timestampMs}.${payload}`, "utf8")
    .digest("hex");
  return `t=${timestampMs},v1=${signatureHash}`;
}

function membershipPayload({ eventId, event, membershipId, organizationId, userId, createdAt }) {
  return JSON.stringify({
    id: eventId,
    event,
    created_at: createdAt,
    data: {
      object: "organization_membership",
      id: membershipId,
      user_id: userId,
      organization_id: organizationId,
      organization_name: "cert232-probe",
      status: "active",
      directory_managed: false,
      role: { slug: "member" },
      created_at: createdAt,
      updated_at: createdAt,
      custom_attributes: {},
    },
  });
}

async function postSigned(payload, secret) {
  const sigHeader = sign(payload, secret);
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "WorkOS-Signature": sigHeader,
    },
    body: payload,
  });
  const bodyText = await response.text();
  return {
    status: response.status,
    body: bodyText.slice(0, 4000),
    ok: response.ok,
  };
}

async function main() {
  const { secret } = requireWorkOSSecrets();

  const stamp = new Date().toISOString().replaceAll(":", "").replaceAll(".", "");
  const organizationId = `org_cert232probe_${stamp}`;
  const userId = `user_cert232probe_${stamp}`;
  const membershipId = `om_cert232probe_${stamp}`;
  const createdAt = new Date().toISOString();

  const created = membershipPayload({
    eventId: `event_cert232probe_create_${stamp}`,
    event: "organization_membership.created",
    membershipId,
    organizationId,
    userId,
    createdAt,
  });
  const deleted = membershipPayload({
    eventId: `event_cert232probe_delete_${stamp}`,
    event: "organization_membership.deleted",
    membershipId,
    organizationId,
    userId,
    createdAt: new Date(Date.now() + 1000).toISOString(),
  });

  const createResult = await postSigned(created, secret);
  const deleteResult = await postSigned(deleted, secret);

  const report = {
    url: WEBHOOK_URL,
    organizationId,
    userId,
    membershipId,
    create: createResult,
    delete: deleteResult,
    verdict:
      createResult.ok && deleteResult.ok
        ? "PASS"
        : createResult.status === 401 || deleteResult.status === 401
          ? "FAIL_SIGNATURE"
          : "FAIL",
  };

  await mkdir(OUT_DIR, { recursive: true });
  const outFile = path.join(OUT_DIR, `probe-${stamp}.json`);
  await writeFile(outFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outFile}`);
  console.log(`verdict=${report.verdict} create=${createResult.status} delete=${deleteResult.status}`);
  if (report.verdict !== "PASS") process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
