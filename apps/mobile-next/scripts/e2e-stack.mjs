#!/usr/bin/env node
// Brings up everything the e2e suite needs and reports ready on one URL.
//
// 1. The local Trove Next API (`pnpm --filter @trove/api dev:next`, PGlite, port 3012).
// 2. Metro for the dev client (`expo start`, port 8081).
// 3. A warm iOS bundle, so the first app launch does not wait on a cold build.
// 4. A readiness server (port 8099) that answers only once 1-3 are done.
//
// A service that is already listening (a dev session you started yourself) is reused
// and left running on exit; anything this script spawns is stopped with it. Metro is
// started with EXPO_PUBLIC_API_URL pointing at the local API, overriding `.env`, and the
// warmed bundle is checked for that URL so a run can never write to a remote ledger.

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(appRoot, "../..");

const API_URL = process.env.E2E_API_URL ?? "http://127.0.0.1:3012/api/v2";
const METRO_PORT = Number(process.env.E2E_METRO_PORT ?? 8081);
const METRO_URL = `http://localhost:${METRO_PORT}`;
const READY_PORT = Number(process.env.E2E_READY_PORT ?? 8099);
const BOOT_TIMEOUT_MS = Number(process.env.E2E_BOOT_TIMEOUT_MS ?? 240_000);

const children = [];

const log = (message) => console.log(`[e2e-stack] ${message}`);

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function responds(url, init) {
  try {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(5_000) });
    return response.status < 500;
  } catch {
    return false;
  }
}

async function waitFor(label, check) {
  const deadline = Date.now() + BOOT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await check()) return;
    await sleep(500);
  }
  throw new Error(`${label} did not come up within ${BOOT_TIMEOUT_MS} ms; see .e2e/logs/app.log.`);
}

function start(label, command, args, cwd, env = {}) {
  log(`starting ${label}: ${command} ${args.join(" ")}`);
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ["ignore", "inherit", "inherit"],
  });
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    log(`${label} exited (${signal ?? code}); stopping the stack.`);
    void shutdown(1);
  });
  children.push(child);
  return child;
}

async function ensureApi() {
  const probe = () => responds(`${API_URL}/`);
  if (await probe()) return log(`reusing the API at ${API_URL}`);
  start("API", "pnpm", ["--filter", "@trove/api", "dev:next"], repoRoot);
  await waitFor("The local API", probe);
  log(`API ready at ${API_URL}`);
}

async function ensureMetro() {
  const probe = () => responds(`${METRO_URL}/status`);
  if (await probe()) return log(`reusing Metro at ${METRO_URL}`);
  // CI=1 keeps expo start non-interactive (no prompts, no QR code).
  start("Metro", "pnpm", ["exec", "expo", "start", "--port", String(METRO_PORT)], appRoot, {
    CI: "1",
    EXPO_PUBLIC_API_URL: API_URL,
  });
  await waitFor("Metro", probe);
  log(`Metro ready at ${METRO_URL}`);
}

// Ask Metro for the same manifest the dev client requests, then build its launch bundle.
async function warmBundle() {
  log("warming the iOS bundle (first build can take a minute)");
  const manifest = await fetch(METRO_URL, {
    headers: { "expo-platform": "ios", accept: "application/expo+json,application/json" },
    signal: AbortSignal.timeout(60_000),
  }).then((response) => response.json());
  if (!manifest?.launchAsset?.url) throw new Error("Metro returned no iOS launch bundle URL.");
  const bundleUrl = new URL(manifest.launchAsset.url);
  const response = await fetch(bundleUrl, { signal: AbortSignal.timeout(BOOT_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`The iOS bundle failed to build (HTTP ${response.status}).`);
  const source = await response.text();
  if (!source.includes(API_URL)) {
    throw new Error(
      `The iOS bundle does not use the local API (${API_URL}). A Metro already running on ` +
        `port ${METRO_PORT} was started with another EXPO_PUBLIC_API_URL; stop it (or restart it ` +
        `with EXPO_PUBLIC_API_URL=${API_URL} and --clear) and rerun.`,
    );
  }
  log(`iOS bundle is warm and uses ${API_URL}`);
}

let shuttingDown = false;
async function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill("SIGTERM");
  await sleep(1_000);
  for (const child of children) if (child.exitCode === null) child.kill("SIGKILL");
  process.exit(code);
}
process.once("SIGINT", () => void shutdown(0));
process.once("SIGTERM", () => void shutdown(0));

try {
  await ensureApi();
  await ensureMetro();
  await warmBundle();
  createServer((_request, response) => response.end("ready")).listen(READY_PORT, "127.0.0.1");
  log(`stack ready; readiness at http://127.0.0.1:${READY_PORT}`);
} catch (error) {
  console.error(`[e2e-stack] ${error instanceof Error ? error.message : String(error)}`);
  await shutdown(1);
}
