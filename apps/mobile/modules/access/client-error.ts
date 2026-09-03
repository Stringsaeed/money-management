export interface ClientFailure {
  readonly status?: number;
  readonly message?: string;
  readonly code?: string;
  readonly retryAfter?: number;
}

export function isUnreachableFailure(error: ClientFailure | Error | null | undefined): boolean {
  if (error == null) return false;
  if (error instanceof TypeError) return true;
  return hasUnreachableStatus(error) || hasUnreachableMessage(error);
}

export function authFailureFromClient(error: ClientFailure | Error) {
  if (isUnreachableFailure(error)) return { kind: "offline" } as const;
  const code = failureCode(error);
  if (code === "INVALID_EMAIL_OR_PASSWORD" || code === "INVALID_PASSWORD") {
    return { kind: "bad_credentials" } as const;
  }
  if (code === "PASSWORD_TOO_SHORT" || code === "PASSWORD_TOO_LONG") {
    return { kind: "weak_password", requirement: "Use at least 8 characters." } as const;
  }
  if (code === "TOO_MANY_REQUESTS") {
    return { kind: "rate_limited", retryAfterSeconds: failureRetryAfter(error) } as const;
  }
  return { kind: "server" } as const;
}

function hasUnreachableStatus(error: ClientFailure | Error): boolean {
  if (error instanceof Error) return false;
  return error.status === 0 || (error.status !== undefined && error.status >= 500);
}

function hasUnreachableMessage(error: ClientFailure | Error): boolean {
  const message = failureMessage(error).toLowerCase();
  return (
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("timeout") ||
    message.includes("unreachable")
  );
}

function failureCode(error: ClientFailure | Error): string {
  if (error instanceof Error) return "";
  return error.code ?? "";
}

function failureMessage(error: ClientFailure | Error): string {
  if (error instanceof Error) return error.message;
  return error.message ?? "";
}

function failureRetryAfter(error: ClientFailure | Error): number {
  if (error instanceof Error) return 30;
  return error.retryAfter ?? 30;
}
