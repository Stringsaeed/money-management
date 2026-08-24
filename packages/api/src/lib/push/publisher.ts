import type { ChangeNotification } from "@trove/protocol";

/**
 * The minimal slice of a `DurableObjectNamespace` the publisher needs — kept
 * structural so tests can stub it without workers runtime globals.
 */
export interface PushNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): { fetch(request: Request): Promise<Response> };
}

export interface PushCapableEnv {
  PUSH_HOUSEHOLD_DO?: PushNamespace;
}

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
 * Builds the pipeline's post-commit publisher from the Workers env. Returns
 * undefined when the DO binding is absent (local node tooling, tests) so
 * callers skip publishing entirely.
 */
export function createHouseholdChangePublisher(env: PushCapableEnv): ChangePublisher | undefined {
  const namespace = env.PUSH_HOUSEHOLD_DO;
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
