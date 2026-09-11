/**
 * Legacy Better Auth email-link gate. Hosted AuthKit owns email codes now, so
 * this gate is intentionally inert on the active path.
 */
export function AuthLinkGate() {
  return null;
}

export function resetConsumedAuthTokensForTests() {
  // No-op retained for older tests during the WorkOS cutover.
}
