/**
 * WorkOS User Management widget integration contract (#225 feasibility).
 *
 * Observed / documented limitations (WorkOS does not promise a last-admin
 * invariant for customer organizations):
 *
 * 1. Sole-admin self-removal or self-demotion may succeed in the widget. A
 *    post-event webhook cannot prevent a mutation that already happened.
 * 2. Sole-admin / sole-member User deletion must be enforced by Trove before
 *    calling WorkOS User deletion — never delegated to the widget.
 * 3. Member and viewer roles must not receive widget tokens. Only organization
 *    admins may open the management surface.
 * 4. Browser handoff must not put reusable credentials in URLs. Mint a short-
 *    lived widget token server-side and open an authenticated management page.
 *
 * Required app-owned guard (downstream lifecycle tickets): before User
 * deletion, if the User is the sole Household admin, require appointing another
 * admin or explicitly deleting the Household first.
 */

export interface WidgetTokenRequest {
  readonly userId: string;
  readonly organizationId: string;
  readonly role: "admin" | "member" | "viewer";
}

export type WidgetTokenDecision =
  | { readonly kind: "mint"; readonly userId: string; readonly organizationId: string }
  | { readonly kind: "deny"; readonly reason: "not_admin" | "missing_organization" };

export function decideWidgetToken(input: WidgetTokenRequest): WidgetTokenDecision {
  if (!input.organizationId.trim()) {
    return { kind: "deny", reason: "missing_organization" };
  }
  if (input.role !== "admin") {
    return { kind: "deny", reason: "not_admin" };
  }
  return {
    kind: "mint",
    userId: input.userId,
    organizationId: input.organizationId,
  };
}

export const WIDGET_SAFEGUARD_FINDINGS = [
  "WorkOS User Management widget does not document prevention of sole-admin self-removal or self-demotion for customer organizations.",
  "Trove must keep an app-owned User-deletion guard for sole-admin Households.",
  "Post-event repair via webhooks is not prevention; do not treat webhook reconciliation as a last-admin invariant.",
  "Widget tokens are admin-only; members and viewers are denied at the Trove boundary.",
] as const;
