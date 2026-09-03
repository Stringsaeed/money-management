export type AuthLinkKind = "magic" | "reset";

export function buildEmailLink(kind: AuthLinkKind, token: string, origin: string): string {
  const base = origin.endsWith("/") ? origin.slice(0, -1) : origin;
  return `${base}/l/${kind}?token=${encodeURIComponent(token)}`;
}
