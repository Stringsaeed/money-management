import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { z } from "zod";

import { apiRequest, setApiAuthProvider, type ApiAuthHeader } from "@/data/http";

import type { AuthActionResult, GuestPrincipal, SignedInPrincipal } from "./auth-types";

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID ?? "";
const REDIRECT_URI = process.env.EXPO_PUBLIC_WORKOS_REDIRECT_URI ?? "trove-next://callback";
const AUTHORIZE_URL = "https://api.workos.com/user_management/authorize";
const AUTHENTICATE_URL = "https://api.workos.com/user_management/authenticate";

const REGISTERED_SESSION_KEY = "trove-next.workos.session";
const GUEST_SESSION_KEY = "trove-next.guest.session";
const PKCE_KEY = "trove-next.workos.pkce";
const PKCE_TTL_MS = 10 * 60 * 1000;
const REFRESH_SKEW_MS = 10_000;

const signedInPrincipalSchema: z.ZodType<SignedInPrincipal> = z.object({
  kind: z.literal("user"),
  userId: z.string().min(1),
  workosUserId: z.string().min(1),
  email: z.string(),
  name: z.string().min(1),
});

const guestPrincipalSchema: z.ZodType<GuestPrincipal> = z.object({
  kind: z.literal("guest"),
  guestSessionId: z.string().min(1),
});

const registeredSessionSchema = z.object({
  principal: signedInPrincipalSchema,
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.number().int().positive(),
});

const guestSessionSchema = z.object({
  principal: guestPrincipalSchema,
  token: z.string().min(1),
  expiresAt: z.string().datetime(),
});

const authResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  user: z.object({
    id: z.string().min(1),
    email: z.string(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
  }),
});

const guestResponseSchema = z.object({
  session: z.object({
    kind: z.literal("guest"),
    guestSessionId: z.string().min(1),
    token: z.string().min(1),
    expiresAt: z.string().datetime(),
  }),
});

const claimResponseSchema = z.object({
  status: z.enum(["claimed", "already_claimed"]),
});

type StoredRegisteredSession = z.infer<typeof registeredSessionSchema>;
type StoredGuestSession = z.infer<typeof guestSessionSchema>;

let registeredSession: StoredRegisteredSession | null = null;
let guestSession: StoredGuestSession | null = null;
let refreshInFlight: Promise<StoredRegisteredSession | null> | null = null;
let sessionGeneration = 0;
const authListeners = new Set<() => void>();

export class TransientAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransientAuthError";
  }
}

export function subscribeAuthState(listener: () => void): () => void {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

function emitAuthState(): void {
  for (const listener of authListeners) listener();
}

async function getValidRegisteredSession(): Promise<StoredRegisteredSession | null> {
  if (!registeredSession) return null;
  if (registeredSession.expiresAt > Date.now() + REFRESH_SKEW_MS) return registeredSession;
  return refreshRegisteredSession(registeredSession);
}

async function principalToAuthHeader(): Promise<ApiAuthHeader> {
  const validRegistered = await getValidRegisteredSession();
  if (validRegistered) return { kind: "user", accessToken: validRegistered.accessToken };
  if (guestSession) return { kind: "guest", token: guestSession.token };
  return null;
}

setApiAuthProvider(principalToAuthHeader);

async function persistRegisteredSession(session: StoredRegisteredSession): Promise<void> {
  registeredSession = session;
  await SecureStore.setItemAsync(REGISTERED_SESSION_KEY, JSON.stringify(session));
  emitAuthState();
}

async function persistGuestSession(session: StoredGuestSession): Promise<void> {
  guestSession = session;
  await SecureStore.setItemAsync(GUEST_SESSION_KEY, JSON.stringify(session));
  emitAuthState();
}

async function randomUrlSafe(bytes: number): Promise<string> {
  const values = await Crypto.getRandomBytesAsync(bytes);
  let binary = "";
  for (const byte of values) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function sha256Base64Url(value: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value, {
    encoding: Crypto.CryptoEncoding.BASE64,
  });
  return digest.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function readExpMs(accessToken: string): number {
  try {
    const segment = accessToken.split(".")[1];
    if (!segment) return Date.now() + 5 * 60 * 1000;
    const padded = segment.replaceAll("-", "+").replaceAll("_", "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const payload = z
      .object({ exp: z.number().optional() })
      .safeParse(JSON.parse(atob(padded + pad)));
    return payload.success && payload.data.exp
      ? payload.data.exp * 1000
      : Date.now() + 5 * 60 * 1000;
  } catch {
    return Date.now() + 5 * 60 * 1000;
  }
}

function registeredSessionFromResponse(
  value: z.infer<typeof authResponseSchema>,
): StoredRegisteredSession {
  const first = value.user.first_name ?? "";
  const last = value.user.last_name ?? "";
  const name = [first, last].filter(Boolean).join(" ").trim() || value.user.email || value.user.id;
  return registeredSessionSchema.parse({
    principal: {
      kind: "user",
      userId: value.user.id,
      workosUserId: value.user.id,
      email: value.user.email,
      name,
    },
    accessToken: value.access_token,
    refreshToken: value.refresh_token,
    expiresAt: readExpMs(value.access_token),
  });
}

async function loadStoredSessions(): Promise<void> {
  const [registeredRaw, guestRaw] = await Promise.all([
    SecureStore.getItemAsync(REGISTERED_SESSION_KEY),
    SecureStore.getItemAsync(GUEST_SESSION_KEY),
  ]);
  const parseStored = <T>(raw: string | null, schema: z.ZodType<T>): T | null => {
    if (!raw) return null;
    try {
      const parsed = schema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  };
  registeredSession = parseStored(registeredRaw, registeredSessionSchema);
  guestSession = parseStored(guestRaw, guestSessionSchema);
  if (guestSession && new Date(guestSession.expiresAt).getTime() <= Date.now()) {
    guestSession = null;
    await SecureStore.deleteItemAsync(GUEST_SESSION_KEY);
  }
}

// eslint-disable-next-line complexity -- refresh handles rotation, race guards, and terminal/transient failures in one auth boundary.
async function refreshRegisteredSession(
  session: StoredRegisteredSession,
): Promise<StoredRegisteredSession | null> {
  if (refreshInFlight) return refreshInFlight;
  const refreshGeneration = sessionGeneration;
  // eslint-disable-next-line complexity -- the single-flight refresh task owns all terminal/transient branches.
  refreshInFlight = (async () => {
    try {
      const response = await fetch(AUTHENTICATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          refresh_token: session.refreshToken,
          grant_type: "refresh_token",
        }).toString(),
      });
      if (response.status === 429 || response.status >= 500) {
        throw new TransientAuthError("WorkOS is temporarily unavailable.");
      }
      if (!response.ok) {
        if (
          refreshGeneration === sessionGeneration &&
          registeredSession?.refreshToken === session.refreshToken
        ) {
          registeredSession = null;
          await SecureStore.deleteItemAsync(REGISTERED_SESSION_KEY);
          emitAuthState();
        }
        return null;
      }
      const next = registeredSessionFromResponse(authResponseSchema.parse(await response.json()));
      if (
        refreshGeneration !== sessionGeneration ||
        registeredSession?.refreshToken !== session.refreshToken
      ) {
        return registeredSession;
      }
      await persistRegisteredSession(next);
      return next;
    } catch (error) {
      if (error instanceof TransientAuthError || error instanceof Error) return session;
      throw error;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function hydrateAuth(): Promise<void> {
  await loadStoredSessions();
  if (registeredSession) await getValidRegisteredSession();
}

export function currentRegisteredSession(): StoredRegisteredSession | null {
  return registeredSession;
}

export function currentGuestSession(): StoredGuestSession | null {
  return guestSession;
}

function parseCallback(url: string): { code: string; state: string } | { error: string } {
  const parsed = Linking.parse(url);
  if (parsed.scheme !== Linking.parse(REDIRECT_URI).scheme) {
    return { error: "The sign-in callback was sent to an unexpected app." };
  }
  const query = z
    .object({
      code: z.string().optional(),
      state: z.string().optional(),
      error: z.string().optional(),
      error_description: z.string().optional(),
    })
    .parse(parsed.queryParams ?? {});
  if (query.error) return { error: query.error_description ?? query.error };
  if (!query.code || !query.state) return { error: "The sign-in callback was incomplete." };
  return { code: query.code, state: query.state };
}

type WorkOSAuthenticationResult =
  | { readonly kind: "signed_in"; readonly session: StoredRegisteredSession }
  | { readonly kind: "cancelled" }
  | { readonly kind: "failed"; readonly message: string };

// eslint-disable-next-line complexity -- this is the single PKCE callback boundary and validates every state transition.
async function authenticateWorkOS(): Promise<WorkOSAuthenticationResult> {
  if (!CLIENT_ID) return { kind: "failed", message: "WorkOS sign-in is not configured." };
  const codeVerifier = await randomUrlSafe(32);
  const state = await randomUrlSafe(24);
  const challenge = await sha256Base64Url(codeVerifier);
  await SecureStore.setItemAsync(
    PKCE_KEY,
    JSON.stringify({ codeVerifier, state, expiresAt: Date.now() + PKCE_TTL_MS }),
  );
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    provider: "authkit",
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  });
  const result = await WebBrowser.openAuthSessionAsync(
    `${AUTHORIZE_URL}?${params.toString()}`,
    REDIRECT_URI,
  );
  if (result.type !== "success" || !("url" in result) || !result.url) {
    await SecureStore.deleteItemAsync(PKCE_KEY);
    return { kind: "cancelled" };
  }
  const callback = parseCallback(result.url);
  if ("error" in callback) {
    await SecureStore.deleteItemAsync(PKCE_KEY);
    return { kind: "failed", message: callback.error };
  }
  const rawState = await SecureStore.getItemAsync(PKCE_KEY);
  await SecureStore.deleteItemAsync(PKCE_KEY);
  const saved = z
    .object({ codeVerifier: z.string(), state: z.string(), expiresAt: z.number() })
    .safeParse(rawState ? JSON.parse(rawState) : null);
  if (!saved.success || saved.data.expiresAt < Date.now() || saved.data.state !== callback.state) {
    return { kind: "failed", message: "Sign-in state expired or did not match." };
  }
  const response = await fetch(AUTHENTICATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      code: callback.code,
      code_verifier: saved.data.codeVerifier,
      grant_type: "authorization_code",
    }).toString(),
  });
  if (!response.ok) return { kind: "failed", message: "WorkOS could not complete sign-in." };
  const session = registeredSessionFromResponse(authResponseSchema.parse(await response.json()));
  return { kind: "signed_in", session };
}

export async function signInWithWorkOS(): Promise<AuthActionResult> {
  const result = await authenticateWorkOS();
  if (result.kind !== "signed_in") return result;
  await persistRegisteredSession(result.session);
  return { kind: "signed_in", principal: result.session.principal };
}

export async function continueAsGuest(): Promise<AuthActionResult> {
  const response = await apiRequest("/auth/guest", {
    method: "POST",
    skipAuth: true,
    schema: guestResponseSchema,
  });
  const session = guestSessionSchema.parse({
    principal: {
      kind: "guest",
      guestSessionId: response.session.guestSessionId,
    },
    token: response.session.token,
    expiresAt: response.session.expiresAt,
  });
  await persistGuestSession(session);
  return { kind: "guest", principal: session.principal };
}

export async function claimGuest(
  sessionOverride?: StoredRegisteredSession,
  publish = true,
): Promise<{ readonly status: "claimed" | "already_claimed" }> {
  if (!guestSession) throw new Error("There is no guest ledger to save.");
  const response = await apiRequest("/auth/claim", {
    method: "POST",
    body: JSON.stringify({ guestToken: guestSession.token }),
    auth: sessionOverride ? { kind: "user", accessToken: sessionOverride.accessToken } : undefined,
    schema: claimResponseSchema,
  });
  guestSession = null;
  await SecureStore.deleteItemAsync(GUEST_SESSION_KEY);
  if (publish) emitAuthState();
  return response;
}

export async function saveGuestToAccount(): Promise<AuthActionResult> {
  const result = await authenticateWorkOS();
  if (result.kind !== "signed_in") return result;
  try {
    // Keep the credential private until the server has atomically claimed the
    // guest ledger. The provider therefore remains guest during this request.
    await claimGuest(result.session, false);
    await persistRegisteredSession(result.session);
    return { kind: "signed_in", principal: result.session.principal };
  } catch (error) {
    // Keep the guest ledger available after a conflict, and avoid exposing the
    // newly authenticated identity to the rest of the app until claiming ran.
    registeredSession = null;
    await SecureStore.deleteItemAsync(REGISTERED_SESSION_KEY);
    return {
      kind: "failed",
      message: error instanceof Error ? error.message : "Could not save the guest ledger.",
    };
  }
}

export async function signOut(): Promise<void> {
  sessionGeneration += 1;
  if (guestSession) {
    await apiRequest("/auth/revoke", {
      method: "POST",
      skipAuth: true,
      headers: { Authorization: `Guest ${guestSession.token}` },
      schema: z.object({ ok: z.literal(true) }),
    }).catch(() => undefined);
  }
  registeredSession = null;
  guestSession = null;
  await Promise.all([
    SecureStore.deleteItemAsync(REGISTERED_SESSION_KEY),
    SecureStore.deleteItemAsync(GUEST_SESSION_KEY),
    SecureStore.deleteItemAsync(PKCE_KEY),
  ]);
  emitAuthState();
}
