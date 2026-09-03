import * as SecureStore from "expo-secure-store";

import { sameIdentity } from "./identity";
import type { IdentityClaim } from "./types";

const USER_ID_KEY = "trove.identity-claim.user-id";
const EMAIL_KEY = "trove.identity-claim.email";
const DISPLAY_NAME_KEY = "trove.identity-claim.display-name";
const ESTABLISHED_AT_KEY = "trove.identity-claim.established-at";

export async function readClaim(): Promise<IdentityClaim> {
  try {
    return claimFromFields({
      userId: await SecureStore.getItemAsync(USER_ID_KEY),
      email: await SecureStore.getItemAsync(EMAIL_KEY),
      displayName: await SecureStore.getItemAsync(DISPLAY_NAME_KEY),
      establishedAt: await SecureStore.getItemAsync(ESTABLISHED_AT_KEY),
    });
  } catch {
    return { kind: "none" };
  }
}

export async function writeClaim(claim: IdentityClaim): Promise<void> {
  if (claim.kind === "none") {
    await clearClaim();
    return;
  }
  const current = await readClaim();
  if (
    current.kind === "held" &&
    sameIdentity(current.user, claim.user) &&
    current.establishedAt === claim.establishedAt
  ) {
    return;
  }
  await SecureStore.setItemAsync(USER_ID_KEY, claim.user.userId);
  await SecureStore.setItemAsync(EMAIL_KEY, claim.user.email);
  await SecureStore.setItemAsync(DISPLAY_NAME_KEY, claim.user.displayName);
  await SecureStore.setItemAsync(ESTABLISHED_AT_KEY, claim.establishedAt);
}

export async function clearClaim(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_ID_KEY);
  await SecureStore.deleteItemAsync(EMAIL_KEY);
  await SecureStore.deleteItemAsync(DISPLAY_NAME_KEY);
  await SecureStore.deleteItemAsync(ESTABLISHED_AT_KEY);
}

export function claimFromFields(input: {
  readonly userId: string | null;
  readonly email: string | null;
  readonly displayName: string | null;
  readonly establishedAt: string | null;
}): IdentityClaim {
  if (!input.userId || !input.email || !input.establishedAt) return { kind: "none" };
  return {
    kind: "held",
    user: {
      userId: input.userId,
      email: input.email,
      displayName: input.displayName ?? "",
    },
    establishedAt: input.establishedAt,
  };
}
