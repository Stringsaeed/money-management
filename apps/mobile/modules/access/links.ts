import type { AuthLinkKind, LinkGrant } from "./types";

const AUTH_LINK_HOST = "auth.trove.ing";

export function parseAuthLink(url: string): LinkGrant | null {
  const parsed = parseAbsoluteUrl(url);
  if (!parsed) return null;
  if (!isTrustedAuthCarrier(parsed)) return null;
  const kind = linkKindFromUrl(parsed);
  const token = parsed.searchParams.get("token");
  if (!kind || !token) return null;
  return kind === "magic" ? { kind: "sign_in_token", token } : { kind: "reset_token", token };
}

export function parseAuthLinkFailure(url: string): "unusable" | null {
  const parsed = parseAbsoluteUrl(url);
  if (!parsed || !isTrustedAuthCarrier(parsed)) return null;
  return parsed.searchParams.get("error") ? "unusable" : null;
}

function parseAbsoluteUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function isTrustedAuthCarrier(parsed: URL): boolean {
  if (parsed.protocol === "trove:") return true;
  return parsed.protocol === "https:" && parsed.hostname === AUTH_LINK_HOST;
}

function linkKindFromUrl(parsed: URL): AuthLinkKind | null {
  if (parsed.protocol === "trove:" && parsed.hostname === "l") {
    return kindFromSegment(parsed.pathname.replace(/^\//, ""));
  }
  if (parsed.pathname === "/l/magic") return "magic";
  if (parsed.pathname === "/l/reset") return "reset";
  return null;
}

function kindFromSegment(segment: string): AuthLinkKind | null {
  if (segment === "magic") return "magic";
  if (segment === "reset") return "reset";
  return null;
}
