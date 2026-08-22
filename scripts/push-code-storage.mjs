#!/usr/bin/env node
/**
 * Pushes the current branch (or branches given as args) to Code Storage.
 *
 * Reads ORG_NAME and PIERRE_PRIVATE_KEY from .env, mints a short-lived
 * git:write JWT, and pushes via the authenticated URL so no token is ever
 * persisted in .git/config.
 *
 * Usage:
 *   pnpm push:storage            # push current branch
 *   pnpm push:storage main dev   # push specific branches
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const REMOTE_NAME = "code_storage";

const root = path.resolve(import.meta.dirname, "..");

function loadEnv(file) {
  const env = {};
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[trimmed.slice(0, eq).trim()] = value.replaceAll("\\n", "\n");
  }
  return env;
}

function b64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function mintJwt(orgName, privateKeyPem, repoId, ttlSeconds = 3600) {
  const key = crypto.createPrivateKey(privateKeyPem);
  const alg =
    key.asymmetricKeyType === "ec"
      ? "ES256"
      : key.asymmetricKeyType === "rsa"
        ? "RS256"
        : key.asymmetricKeyType === "ed25519"
          ? "EdDSA"
          : null;
  if (!alg) throw new Error(`Unsupported private key type: ${key.asymmetricKeyType}`);

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg, typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      iss: orgName,
      sub: "@pierre/storage",
      repo: repoId,
      scopes: ["git:read", "git:write"],
      iat: now,
      exp: now + ttlSeconds,
    }),
  );
  const signingInput = `${header}.${payload}`;
  const signature =
    alg === "ES256"
      ? crypto.sign("sha256", signingInput, { key, dsaEncoding: "ieee-p1363" })
      : crypto.sign(alg === "EdDSA" ? null : "sha256", signingInput, key);
  return `${signingInput}.${b64url(signature)}`;
}

function repoIdFromRemote() {
  try {
    const url = execFileSync("git", ["remote", "get-url", REMOTE_NAME], {
      cwd: root,
      encoding: "utf8",
    }).trim();
    return url.match(/code\.storage\/([^/@]+)\.git/)?.[1] ?? null;
  } catch {
    return null;
  }
}

function main() {
  const { ORG_NAME, PIERRE_PRIVATE_KEY } = loadEnv(path.join(root, ".env"));
  if (!ORG_NAME || !PIERRE_PRIVATE_KEY) {
    console.error(
      "Missing ORG_NAME or PIERRE_PRIVATE_KEY in .env — cannot mint a Code Storage token.",
    );
    process.exit(1);
  }

  const repoId = repoIdFromRemote();
  if (!repoId) {
    console.error(
      `Could not resolve a repo id from the "${REMOTE_NAME}" remote. Add it first:\n` +
        `  git remote add ${REMOTE_NAME} https://saeed.code.storage/<REPO_ID>.git`,
    );
    process.exit(1);
  }

  const branches = process.argv.slice(2);
  const branch =
    branches[0] ??
    execFileSync("git", ["branch", "--show-current"], {
      cwd: root,
      encoding: "utf8",
    }).trim();
  if (!branch) {
    console.error("Not on any branch (detached HEAD?) — pass a branch name explicitly.");
    process.exit(1);
  }

  const targets = branches.length > 0 ? branches : [branch];
  const token = mintJwt(ORG_NAME, PIERRE_PRIVATE_KEY, repoId);
  const url = `https://t:${token}@${ORG_NAME}.code.storage/${repoId}.git`;

  for (const target of targets) {
    console.log(`Pushing ${target} -> ${REMOTE_NAME} (${ORG_NAME}.code.storage/${repoId})`);
    execFileSync("git", ["push", url, `${target}:${target}`], {
      cwd: root,
      stdio: "inherit",
    });
  }
  console.log("Done ✅");
}

main();
