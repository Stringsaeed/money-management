import type { LocalOnlyResult } from "@trove/protocol";

/**
 * Remote kill switch (#99): `kill_switch_local_only`.
 *
 * Carrier choice — a Worker **env var**, not KV: the deployment (Alchemy,
 * `packages/infra/alchemy.run.ts`) binds no KV namespaces today, and the flag
 * is read once per mutation, not hot-looped. Toggling it remotely is an env
 * edit on the Worker (`wrangler versions upload` / dashboard → Settings →
 * Variables) with no code deploy; see docs/architecture/observability.md.
 */
export const KILL_SWITCH_FLAG = "KILL_SWITCH_LOCAL_ONLY" as const;

const TRUTHY = new Set(["on", "true", "1"]);

export function isKillSwitchEngaged(value: string | undefined | null): boolean {
  return value !== null && value !== undefined && TRUTHY.has(value.trim().toLowerCase());
}

/** The typed response every mutation receives while the switch is engaged. */
export const LOCAL_ONLY_RESULT: LocalOnlyResult = {
  kind: "local_only",
  reason: "kill_switch_local_only",
};
