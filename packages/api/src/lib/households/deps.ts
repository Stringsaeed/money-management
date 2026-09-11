import { createWorkOSHouseholdDirectory } from "@trove/auth";
import { createDb } from "@trove/db";
import { env } from "@trove/env/server";

import type { HouseholdDeps } from "./service";

/** Production wiring: the request-scoped database plus the live WorkOS directory. */
export function createHouseholdDeps(): HouseholdDeps {
  return {
    db: createDb(),
    directory: createWorkOSHouseholdDirectory(env.WORKOS_API_KEY),
    now: () => new Date(),
  };
}
