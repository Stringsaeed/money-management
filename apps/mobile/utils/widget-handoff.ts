/** Fragment-based handoff URL the app opens in the system browser. */
export function buildWidgetPageUrl(serverUrl: string, code: string): string {
  const base = serverUrl.replace(/\/+$/, "");
  return `${base}/widgets/members#code=${encodeURIComponent(code)}`;
}
