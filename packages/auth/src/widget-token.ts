import { WorkOS } from "@workos-inc/node";

/**
 * Mints a short-lived WorkOS Widgets token for the User Management widget.
 * The API key never leaves the server; the token is bound to the authenticated
 * WorkOS user + organization and must not be placed in URLs.
 */
export async function mintUserManagementWidgetToken(input: {
  readonly apiKey: string;
  readonly userId: string;
  readonly organizationId: string;
}): Promise<{ readonly token: string }> {
  const workos = new WorkOS(input.apiKey);
  const response = await workos.widgets.createToken({
    userId: input.userId,
    organizationId: input.organizationId,
    scopes: ["widgets:users-table:manage"],
  });
  return { token: response.token };
}
