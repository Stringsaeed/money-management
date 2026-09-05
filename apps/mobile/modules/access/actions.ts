import { authClient } from "@/lib/auth-client";

import {
  logAuthLink,
  summarizeClientError,
  summarizeToken,
  summarizeVerifyData,
} from "./auth-link-debug";
import { authFailureFromClient, isUnreachableFailure } from "./client-error";
import { identityFromUser } from "./identity";
import { parseAuthVerifyError } from "./links";
import { probeSession } from "./session-probe";
import type { Identity, LinkOperation, LinkOutcome, SessionProbe } from "./types";

const NO_ACCOUNT_ERROR = "new_user_signup_disabled";

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
  logAuthLink("signup.start", {
    email: input.email,
    nameLen: String(input.displayName.trim().length),
    passwordLen: String(input.password.length),
  });
  try {
    const result = await authClient.signUp.email({
      email: input.email,
      password: input.password,
      name: input.displayName.trim() || input.email,
    });
    logAuthLink("signup.result", {
      error: result.error ? summarizeClientError(result.error) : "null",
      data: summarizeVerifyData(result.data),
    });
    if (result.error) {
      const failure = authFailureFromClient(result.error);
      logAuthLink("signup.done", { outcome: "fail", failure: failure.kind });
      return { kind: "fail", failure };
    }
    const user = result.data?.user;
    if (!user) {
      logAuthLink("signup.done", { outcome: "fail", failure: "server_missing_user" });
      return { kind: "fail", failure: { kind: "server" } };
    }
    logAuthLink("signup.done", { outcome: "ok", userId: user.id });
    return { kind: "ok", value: identityFromUser(user) };
  } catch (error) {
    const failure = authFailureFromClient(error instanceof Error ? error : { message: "failed" });
    logAuthLink("signup.done", {
      outcome: "fail",
      failure: failure.kind,
      message: error instanceof Error ? error.message : "unknown",
    });
    return { kind: "fail", failure };
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
  logAuthLink("redeem.start", { token: summarizeToken(token) });
  try {
    let redirectUrl = "";
    const result = await authClient.magicLink.verify({
      query: { token },
      fetchOptions: {
        onResponse(context) {
          redirectUrl = context.response.url;
        },
      },
    });
    const redirectError = parseAuthVerifyError(redirectUrl) ?? "";
    logAuthLink("redeem.verify", {
      error: result.error ? summarizeClientError(result.error) : "null",
      data: summarizeVerifyData(result.data),
      redirectUrl: redirectUrl || "none",
      redirectError: redirectError || "none",
    });
    if (redirectError === NO_ACCOUNT_ERROR) {
      logAuthLink("redeem.done", { branch: "no_account", outcome: "no_account" });
      return { kind: "no_account" };
    }
    return await outcomeFromVerify(result);
  } catch (error) {
    const outcome = failureOutcome(error instanceof Error ? error : { message: "failed" });
    logAuthLink("redeem.done", {
      branch: "throw",
      outcome: outcome.kind,
      message: error instanceof Error ? error.message : "unknown",
    });
    return outcome;
  }
}

async function outcomeFromVerify(result: {
  readonly data?: { readonly user?: Parameters<typeof identityFromUser>[0] | null } | null;
  readonly error?: Parameters<typeof isUnreachableFailure>[0];
}): Promise<LinkOutcome> {
  if (result.error) {
    const outcome = failureOutcome(result.error);
    logAuthLink("redeem.done", { branch: "verify_error", outcome: outcome.kind });
    return outcome;
  }
  const user = result.data?.user;
  if (user) {
    logAuthLink("redeem.done", {
      branch: "verify_user",
      outcome: "signed_in",
      userId: user.id,
    });
    return { kind: "signed_in", user: identityFromUser(user) };
  }
  return outcomeFromProbe(await probeSession());
}

function outcomeFromProbe(probe: SessionProbe): LinkOutcome {
  logAuthLink("redeem.probe", {
    kind: probe.kind,
    userId: probe.kind === "session" ? probe.user.userId : "none",
  });
  if (probe.kind === "session") {
    logAuthLink("redeem.done", { branch: "probe_session", outcome: "signed_in" });
    return { kind: "signed_in", user: probe.user };
  }
  if (probe.kind === "unreachable") {
    logAuthLink("redeem.done", { branch: "probe_unreachable", outcome: "offline" });
    return { kind: "offline" };
  }
  logAuthLink("redeem.done", { branch: "no_user_no_session", outcome: "unusable" });
  return { kind: "unusable", operation: "sign_in" };
}

function failureOutcome(error: Parameters<typeof isUnreachableFailure>[0]): LinkOutcome {
  return isUnreachableFailure(error)
    ? { kind: "offline" }
    : { kind: "unusable", operation: "sign_in" };
}
