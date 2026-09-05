/* Temporary device diagnostics for magic-link redeem. Remove after the failure is identified. */
// oxlint-disable anti-slop/no-runtime-typeof, anti-slop/no-unknown-parameters, anti-slop/require-safety-comment-for-type-assertion, anti-slop/no-unsafe-dictionary-type -- debug summarizers inspect opaque client payloads

export function logAuthLink(step: string, detail: Record<string, string> = {}): void {
  const parts = Object.entries(detail).map(([key, value]) => `${key}=${JSON.stringify(value)}`);
  console.log(`[auth-link] ${step}${parts.length ? ` ${parts.join(" ")}` : ""}`);
}

export function summarizeToken(token: string): string {
  if (token.length <= 8) return `len=${token.length}`;
  return `len=${token.length} head=${token.slice(0, 4)} tail=${token.slice(-4)}`;
}

export function summarizeVerifyData(data: unknown): string {
  if (data == null) return "null";
  if (typeof data === "string") return `string:${JSON.stringify(data)}`;
  if (typeof data !== "object") return `${typeof data}:${String(data)}`;
  const record = data as Record<string, unknown>;
  const keys = Object.keys(record).sort().join(",");
  const user = record.user as { id?: string; email?: string } | null | undefined;
  if (user == null) return `object keys=[${keys}] user=${user === null ? "null" : "missing"}`;
  return `object keys=[${keys}] user.id=${user.id ?? "?"} user.email=${user.email ?? "?"}`;
}

export function summarizeClientError(error: unknown): string {
  if (error instanceof Error) return `Error:${error.message}`;
  if (error == null || typeof error !== "object") return String(error);
  const record = error as { status?: number; code?: string; message?: string };
  return `status=${record.status ?? "?"} code=${record.code ?? "?"} message=${record.message ?? "?"}`;
}
