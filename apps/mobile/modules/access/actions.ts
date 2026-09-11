import { identityFromUser } from "./identity";
import { signInWithAuthKit } from "@/lib/auth-client";
import type { Identity } from "./types";
import { authFailureFromClient } from "./client-error";

export type AuthActionFailure = ReturnType<typeof authFailureFromClient>;

export type AuthActionResult<T> =
  | { readonly kind: "ok"; readonly value: T }
  | { readonly kind: "fail"; readonly failure: AuthActionFailure }
  | { readonly kind: "cancelled" };

/** Opens hosted AuthKit. Sign-in never creates a Household or uploads local data. */
export async function beginHostedSignIn(): Promise<AuthActionResult<Identity>> {
  try {
    const result = await signInWithAuthKit();
    if (result.kind === "cancelled") return { kind: "cancelled" };
    if (result.kind === "failed") {
      return {
        kind: "fail",
        failure: authFailureFromClient({ message: result.message }),
      };
    }
    return { kind: "ok", value: identityFromUser(result.user) };
  } catch (error) {
    return {
      kind: "fail",
      failure: authFailureFromClient(error instanceof Error ? error : { message: "failed" }),
    };
  }
}
