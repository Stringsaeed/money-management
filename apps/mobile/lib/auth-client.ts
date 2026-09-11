import { useEffect, useState } from "react";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { z } from "zod";

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID ?? "";
const REDIRECT_URI = process.env.EXPO_PUBLIC_WORKOS_REDIRECT_URI ?? "trove://callback";
const AUTHORIZE_URL = "https://api.workos.com/user_management/authorize";
const AUTHENTICATE_URL = "https://api.workos.com/user_management/authenticate";

const SESSION_KEY = "trove.workos.session";
const PKCE_KEY = "trove.workos.pkce";
const PKCE_TTL_MS = 10 * 60 * 1000;

const sessionUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string(),
});

const storedSessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  user: sessionUserSchema,
  organizationId: z.string().min(1).nullable(),
  expiresAt: z.number().int().positive(),
});

const pkceStateSchema = z.object({
  codeVerifier: z.string().min(1),
  state: z.string().min(1),
  expiresAt: z.number().int().positive(),
});

const authResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  organization_id: z.string().min(1).optional(),
  user: z.object({
    id: z.string().min(1),
    email: z.string().email(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
  }),
});

const jwtPayloadSchema = z
  .object({
    exp: z.number().optional(),
    org_id: z.string().min(1).optional(),
  })
  .passthrough();

export type SessionUser = z.infer<typeof sessionUserSchema>;
export type StoredAuthSession = z.infer<typeof storedSessionSchema>;

type PkceState = z.infer<typeof pkceStateSchema>;
type AuthListener = () => void;

type SessionSnapshot = {
  readonly data: { readonly user: SessionUser } | null;
  readonly isPending: boolean;
  readonly error: null;
};

let memorySession: StoredAuthSession | null | undefined;
let refreshInFlight: Promise<StoredAuthSession | null> | null = null;
const listeners = new Set<AuthListener>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeAuthSession(listener: AuthListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getValidSession();
  return session?.accessToken ?? null;
}

export async function getSession(): Promise<{ data: { user: SessionUser } | null }> {
  const session = await getValidSession();
  return { data: session ? { user: session.user } : null };
}

export function useSession(): SessionSnapshot {
  const [snapshot, setSnapshot] = useState<SessionSnapshot>({
    data: null,
    isPending: true,
    error: null,
  });

  useEffect(() => {
    const cancelled = false;
    const sync = () => {
      void getValidSession().then((session) => {
        if (cancelled) return;
        setSnapshot({
          data: session ? { user: session.user } : null,
          isPending: false,
          error: null,
        });
      });
    };
    sync();
    return subscribeAuthSession(sync);
  }, []);

  return snapshot;
}

export type AuthKitResult =
  | { readonly kind: "signed_in"; readonly user: SessionUser }
  | { readonly kind: "cancelled" }
  | { readonly kind: "failed"; readonly message: string };

/** Hosted AuthKit email-code sign-in with PKCE. Does not create Households or upload data. */
export async function signInWithAuthKit(): Promise<AuthKitResult> {
  if (!CLIENT_ID) {
    return { kind: "failed", message: "EXPO_PUBLIC_WORKOS_CLIENT_ID is not configured." };
  }

  try {
    return await runAuthKitSignIn(CLIENT_ID, REDIRECT_URI);
  } catch (error) {
    await SecureStore.deleteItemAsync(PKCE_KEY).catch(() => undefined);
    return {
      kind: "failed",
      message: error instanceof Error ? error.message : "Sign-in failed.",
    };
  }
}

async function runAuthKitSignIn(clientId: string, redirectUri: string): Promise<AuthKitResult> {
  const { url, pkce } = await buildAuthorization(clientId, redirectUri);
  await SecureStore.setItemAsync(PKCE_KEY, JSON.stringify(pkce));

  const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);
  if (result.type !== "success" || !("url" in result) || !result.url) {
    await SecureStore.deleteItemAsync(PKCE_KEY);
    return { kind: "cancelled" };
  }

  const callback = parseCallback(result.url);
  if (callback.kind === "error") {
    await SecureStore.deleteItemAsync(PKCE_KEY);
    return { kind: "failed", message: callback.message };
  }

  const stored = await SecureStore.getItemAsync(PKCE_KEY);
  await SecureStore.deleteItemAsync(PKCE_KEY);
  const pkceState = pkceStateSchema.safeParse(stored ? JSON.parse(stored) : null);
  if (!pkceState.success) {
    return { kind: "failed", message: "Sign-in state was lost. Try again." };
  }
  if (pkceState.data.expiresAt < Date.now()) {
    return { kind: "failed", message: "Sign-in expired. Try again." };
  }
  if (pkceState.data.state !== callback.state) {
    return { kind: "failed", message: "Sign-in state mismatch. Try again." };
  }

  const session = await exchangeCode({
    clientId,
    code: callback.code,
    codeVerifier: pkceState.data.codeVerifier,
  });
  await persistSession(session);
  return { kind: "signed_in", user: session.user };
}

export async function signOut(): Promise<void> {
  memorySession = null;
  await SecureStore.deleteItemAsync(SESSION_KEY);
  await SecureStore.deleteItemAsync(PKCE_KEY);
  emit();
}

async function getValidSession(): Promise<StoredAuthSession | null> {
  const session = await readSession();
  if (!session) return null;
  if (Date.now() < session.expiresAt - 10_000) return session;
  return refreshSession(session);
}

async function refreshSession(session: StoredAuthSession): Promise<StoredAuthSession | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const next = await authenticateRefresh({
        clientId: CLIENT_ID,
        refreshToken: session.refreshToken,
      });
      await persistSession(next);
      return next;
    } catch {
      memorySession = null;
      await SecureStore.deleteItemAsync(SESSION_KEY);
      emit();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function readSession(): Promise<StoredAuthSession | null> {
  if (memorySession !== undefined) return memorySession;
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) {
    memorySession = null;
    return null;
  }
  const parsed = storedSessionSchema.safeParse(JSON.parse(raw));
  memorySession = parsed.success ? parsed.data : null;
  return memorySession;
}

async function persistSession(session: StoredAuthSession): Promise<void> {
  memorySession = session;
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  emit();
}

async function buildAuthorization(clientId: string, redirectUri: string) {
  const codeVerifier = await randomUrlSafe(32);
  const state = await randomUrlSafe(16);
  const challenge = await sha256Base64Url(codeVerifier);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    provider: "authkit",
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  });
  return {
    url: `${AUTHORIZE_URL}?${params.toString()}`,
    pkce: {
      codeVerifier,
      state,
      expiresAt: Date.now() + PKCE_TTL_MS,
    } satisfies PkceState,
  };
}

function parseCallback(
  url: string,
):
  | { readonly kind: "ok"; readonly code: string; readonly state: string }
  | { readonly kind: "error"; readonly message: string } {
  const parsed = Linking.parse(url);
  const querySchema = z.object({
    error: z.string().optional(),
    error_description: z.string().optional(),
    code: z.string().optional(),
    state: z.string().optional(),
  });
  const query = querySchema.parse(parsed.queryParams ?? {});
  if (query.error) {
    return { kind: "error", message: query.error_description ?? query.error };
  }
  if (!query.code || !query.state) {
    return { kind: "error", message: "AuthKit callback was missing code or state." };
  }
  return { kind: "ok", code: query.code, state: query.state };
}

async function exchangeCode(input: {
  readonly clientId: string;
  readonly code: string;
  readonly codeVerifier: string;
}): Promise<StoredAuthSession> {
  const response = await fetch(AUTHENTICATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: input.clientId,
      code: input.code,
      code_verifier: input.codeVerifier,
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) {
    throw new Error(`AuthKit token exchange failed (${response.status}).`);
  }
  return sessionFromAuthResponse(authResponseSchema.parse(await response.json()));
}

async function authenticateRefresh(input: {
  readonly clientId: string;
  readonly refreshToken: string;
}): Promise<StoredAuthSession> {
  const response = await fetch(AUTHENTICATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: input.clientId,
      refresh_token: input.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) {
    throw new Error(`AuthKit refresh failed (${response.status}).`);
  }
  return sessionFromAuthResponse(authResponseSchema.parse(await response.json()));
}

function sessionFromAuthResponse(record: z.infer<typeof authResponseSchema>): StoredAuthSession {
  const first = record.user.first_name ?? "";
  const last = record.user.last_name ?? "";
  const name = [first, last].filter(Boolean).join(" ").trim() || record.user.email;
  const organizationId = record.organization_id ?? readOrgIdFromAccessToken(record.access_token);

  return storedSessionSchema.parse({
    accessToken: record.access_token,
    refreshToken: record.refresh_token,
    user: {
      id: record.user.id,
      email: record.user.email,
      name,
    },
    organizationId,
    expiresAt: readExpMs(record.access_token),
  });
}

function readExpMs(accessToken: string): number {
  const payload = decodeJwtPayload(accessToken);
  return payload.exp ? payload.exp * 1000 : Date.now() + 5 * 60 * 1000;
}

function readOrgIdFromAccessToken(accessToken: string): string | null {
  return decodeJwtPayload(accessToken).org_id ?? null;
}

function decodeJwtPayload(accessToken: string) {
  try {
    const segment = accessToken.split(".")[1];
    if (!segment) return {};
    return jwtPayloadSchema.parse(JSON.parse(base64UrlDecode(segment)));
  } catch {
    return {};
  }
}

async function randomUrlSafe(bytes: number): Promise<string> {
  const values = await Crypto.getRandomBytesAsync(bytes);
  return base64UrlEncode(values);
}

async function sha256Base64Url(value: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value, {
    encoding: Crypto.CryptoEncoding.BASE64,
  });
  return digest.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(value: string): string {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return atob(padded + pad);
}

/** Cookie auth is retired; prefer getAccessToken(). */
export function getCookie(): string {
  return "";
}

export const authClient = {
  useSession,
  getSession,
  signOut,
  getCookie,
  getAccessToken,
  signInWithAuthKit,
};
