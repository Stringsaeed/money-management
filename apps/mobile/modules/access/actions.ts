import { authClient } from "@/lib/auth-client";

import { authFailureFromClient, isUnreachableFailure } from "./client-error";
import { identityFromUser } from "./identity";
import type { Identity, LinkOperation, LinkOutcome } from "./types";

export type AuthActionFailure = ReturnType<typeof authFailureFromClient>;

export type AuthActionResult<T> =
  | { readonly kind: "ok"; readonly value: T }
  | { readonly kind: "fail"; readonly failure: AuthActionFailure };

export async function sendAuthLink(
  email: string,
  operation: LinkOperation,
): Promise<AuthActionResult<null>> {
  try {
    const result =
      operation === "sign_in"
        ? await authClient.signIn.magicLink({ email })
        : await authClient.requestPasswordReset({ email });
    if (result.error) return { kind: "fail", failure: authFailureFromClient(result.error) };
    return { kind: "ok", value: null };
  } catch (error) {
    return {
      kind: "fail",
      failure: authFailureFromClient(error instanceof Error ? error : { message: "failed" }),
    };
  }
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<AuthActionResult<Identity>> {
  try {
    const result = await authClient.signIn.email({ email, password });
    if (result.error) return { kind: "fail", failure: authFailureFromClient(result.error) };
    const user = result.data?.user;
    if (!user) return { kind: "fail", failure: { kind: "server" } };
    return { kind: "ok", value: identityFromUser(user) };
  } catch (error) {
    return {
      kind: "fail",
      failure: authFailureFromClient(error instanceof Error ? error : { message: "failed" }),
    };
  }
}

export async function createProfile(input: {
  readonly email: string;
  readonly password: string;
  readonly displayName: string;
}): Promise<AuthActionResult<Identity>> {
  try {
    const result = await authClient.signUp.email({
      email: input.email,
      password: input.password,
      name: input.displayName.trim() || input.email,
    });
    if (result.error) return { kind: "fail", failure: authFailureFromClient(result.error) };
    const user = result.data?.user;
    if (!user) return { kind: "fail", failure: { kind: "server" } };
    return { kind: "ok", value: identityFromUser(user) };
  } catch (error) {
    return {
      kind: "fail",
      failure: authFailureFromClient(error instanceof Error ? error : { message: "failed" }),
    };
  }
}

/** Reset does not mint a session. Sign-in with the new password is required. */
export async function completeRecovery(input: {
  readonly email: string;
  readonly password: string;
  readonly token: string;
}): Promise<AuthActionResult<Identity>> {
  try {
    const reset = await authClient.resetPassword({
      newPassword: input.password,
      token: input.token,
    });
    if (reset.error) return { kind: "fail", failure: authFailureFromClient(reset.error) };
    return signInWithPassword(input.email, input.password);
  } catch (error) {
    return {
      kind: "fail",
      failure: authFailureFromClient(error instanceof Error ? error : { message: "failed" }),
    };
  }
}

export async function redeemMagicToken(token: string): Promise<LinkOutcome> {
  try {
    const result = await authClient.magicLink.verify({ query: { token } });
    if (result.error) {
      return isUnreachableFailure(result.error)
        ? { kind: "offline" }
        : { kind: "unusable", operation: "sign_in" };
    }
    const user = result.data?.user;
    if (!user) return { kind: "unusable", operation: "sign_in" };
    return { kind: "signed_in", user: identityFromUser(user) };
  } catch (error) {
    return isUnreachableFailure(error instanceof Error ? error : { message: "failed" })
      ? { kind: "offline" }
      : { kind: "unusable", operation: "sign_in" };
  }
}
