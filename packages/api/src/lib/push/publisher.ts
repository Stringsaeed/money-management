import type { ChangeNotification } from "@trove/protocol";

/**
 * The minimal slice of a `DurableObjectNamespace` the publisher needs — kept
 * structural so tests can stub it without workers runtime globals.
 */
export interface PushNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): { fetch(request: Request): Promise<Response> };
}

export const isPushNamespace = (value: unknown): value is PushNamespace => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return typeof candidate.idFromName === "function" && typeof candidate.get === "function";
};

/**
 * Fire-and-forget publication of one committed change. Receives the household
 * alongside the notification because the wire payload (`{seq, effects}`) is
 * tenancy-free — routing happens here, via the per-household DO identity.
 * Must never throw.
 */
export type ChangePublisher = (
  change: ChangeNotification & { readonly householdId: string },
) => Promise<void>;

/**
 * Builds the pipeline's post-commit publisher from the optional DO binding.
 * Local node tooling and tests have no binding, so callers skip publishing.
 */
export function createHouseholdChangePublisher(
  namespace: PushNamespace | undefined,
): ChangePublisher | undefined {
  if (!namespace) {
    return undefined;
  }
  return async ({ householdId, seq, effects }) => {
    const stub = namespace.get(namespace.idFromName(householdId));
    await stub.fetch(
      new Request("https://push.internal/publish", {
        method: "POST",
        body: JSON.stringify({ seq, effects }),
        headers: { "content-type": "application/json" },
      }),
    );
  };
}
