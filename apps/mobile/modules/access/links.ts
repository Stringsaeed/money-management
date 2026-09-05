import type { AuthLinkKind, LinkGrant } from "./types";

const AUTH_LINK_HOST = "auth.trove.ing";

export function isAuthCarrierPath(pathOrUrl: string): boolean {
  return parseAuthLink(pathOrUrl) !== null || parseAuthLinkFailure(pathOrUrl) !== null;
}

export function parseAuthLink(pathOrUrl: string): LinkGrant | null {
  const carrier = parseAuthCarrier(pathOrUrl);
  if (!carrier || !carrier.token) return null;
  return carrier.kind === "magic"
    ? { kind: "sign_in_token", token: carrier.token }
    : { kind: "reset_token", token: carrier.token };
}

export function parseAuthLinkFailure(pathOrUrl: string): "unusable" | null {
  return parseAuthVerifyError(pathOrUrl) ? "unusable" : null;
}

/** Better Auth verify failures 302 to a trusted host with `?error=`. */
export function parseAuthVerifyError(pathOrUrl: string): string | null {
  const absolute = parseAbsoluteUrl(pathOrUrl);
  if (absolute) {
    if (!isTrustedAuthHost(absolute)) return null;
    return absolute.searchParams.get("error");
  }
  return parseAuthCarrier(pathOrUrl)?.error ?? null;
}

interface AuthCarrier {
  readonly kind: AuthLinkKind;
  readonly token: string | null;
  readonly error: string | null;
}

function parseAuthCarrier(pathOrUrl: string): AuthCarrier | null {
  const absolute = parseAbsoluteUrl(pathOrUrl);
  if (absolute) {
    if (!isTrustedAuthCarrier(absolute)) return null;
    const kind = linkKindFromUrl(absolute);
    if (!kind) return null;
    return {
      kind,
      token: absolute.searchParams.get("token"),
      error: absolute.searchParams.get("error"),
    };
  }
  return parseRelativeAuthCarrier(pathOrUrl);
}

function parseAbsoluteUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function parseRelativeAuthCarrier(pathOrUrl: string): AuthCarrier | null {
  const stripped = pathOrUrl.replace(/^\/+/, "");
  const queryStart = stripped.indexOf("?");
  const pathname = queryStart === -1 ? stripped : stripped.slice(0, queryStart);
  const kind = kindFromPathname(pathname);
  if (!kind) return null;
  const params = new URLSearchParams(queryStart === -1 ? "" : stripped.slice(queryStart + 1));
  return {
    kind,
    token: params.get("token"),
    error: params.get("error"),
  };
}

function isTrustedAuthHost(parsed: URL): boolean {
  if (parsed.protocol === "trove:") return true;
  return parsed.protocol === "https:" && parsed.hostname === AUTH_LINK_HOST;
}

function isTrustedAuthCarrier(parsed: URL): boolean {
  return isTrustedAuthHost(parsed);
}

function linkKindFromUrl(parsed: URL): AuthLinkKind | null {
  if (parsed.protocol === "trove:" && parsed.hostname === "l") {
    return kindFromSegment(parsed.pathname.replace(/^\//, ""));
  }
  return kindFromPathname(parsed.pathname.replace(/^\/+/, ""));
}

function kindFromPathname(pathname: string): AuthLinkKind | null {
  if (pathname === "l/magic") return "magic";
  if (pathname === "l/reset") return "reset";
  return null;
}

function kindFromSegment(segment: string): AuthLinkKind | null {
  if (segment === "magic") return "magic";
  if (segment === "reset") return "reset";
  return null;
}
