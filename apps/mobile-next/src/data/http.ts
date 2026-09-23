/*
 * This module is the intentionally generic transport boundary. Callers must
 * provide a Zod schema for typed responses; the raw overload exists only for
 * transitional endpoints that discard their response body.
 */
/* oxlint-disable anti-slop/no-unknown-parameters, anti-slop/no-unknown-returns, anti-slop/no-known-value-widening, anti-slop/require-safety-comment-for-type-assertion */
import { z } from "zod";

const configuredBaseUrl = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly payload: unknown;

  constructor(status: number, message: string, code: string | null, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

export type ApiAuthHeader =
  | { readonly kind: "user"; readonly accessToken: string }
  | { readonly kind: "guest"; readonly token: string }
  | null;

type ApiAuthProvider = () => Promise<ApiAuthHeader>;
type ApiFetch = typeof fetch;

let authProvider: ApiAuthProvider = async () => null;
let apiFetch: ApiFetch | null = null;

export function setApiAuthProvider(provider: ApiAuthProvider): void {
  authProvider = provider;
}

/** Test and host integrations can provide a fetch implementation without changing auth behavior. */
export function setApiFetch(fetcher: ApiFetch | null): void {
  apiFetch = fetcher;
}

export function apiUrl(path: string): string {
  if (!path.startsWith("/")) throw new Error("API paths must be relative and start with '/'.");
  if (!configuredBaseUrl) throw new Error("EXPO_PUBLIC_API_URL is not configured.");
  return `${configuredBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface ApiRequestOptions extends RequestInit {
  readonly schema?: z.ZodTypeAny;
  readonly skipAuth?: boolean;
  readonly auth?: ApiAuthHeader;
}

function authHeaders(auth: ApiAuthHeader): Record<string, string> {
  if (!auth) return {};
  if (auth.kind === "user") return { Authorization: `Bearer ${auth.accessToken}` };
  return { Authorization: `Guest ${auth.token}` };
}

export async function apiRequest(
  path: string,
  options?: Omit<ApiRequestOptions, "schema">,
): Promise<unknown>;
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions & { readonly schema: z.ZodType<T> },
): Promise<T>;
// eslint-disable-next-line complexity -- request parsing, auth selection, and HTTP error normalization belong at one boundary.
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T | unknown> {
  const { schema, skipAuth, auth, ...requestInit } = options;
  const headers = new Headers(requestInit.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (requestInit.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!skipAuth && !headers.has("Authorization")) {
    const selectedAuth = auth ?? (await authProvider());
    for (const [key, value] of Object.entries(authHeaders(selectedAuth))) headers.set(key, value);
  }

  let response: Response;
  try {
    response = await (apiFetch ?? fetch)(apiUrl(path), { ...requestInit, headers });
  } catch (error) {
    throw new ApiError(
      0,
      "The network is unavailable. Check your connection and try again.",
      "network_error",
      error,
    );
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }
  if (!response.ok) {
    const parsed = z
      .object({
        error: z.object({ code: z.string().optional(), message: z.string().optional() }).optional(),
      })
      .safeParse(payload);
    throw new ApiError(
      response.status,
      parsed.success
        ? (parsed.data.error?.message ?? "The request failed.")
        : "The request failed.",
      parsed.success ? (parsed.data.error?.code ?? null) : null,
      payload,
    );
  }

  if (schema) return schema.parse(payload) as T;
  return payload;
}
