import type { AccessCore, ReturnTo } from "./types";

export type AuthSheetSession =
  | { readonly kind: "closed" }
  | {
      readonly kind: "open";
      readonly target: ReturnTo;
      readonly grant?: { readonly token: string };
    };

export type PresentAuthSheetInput = {
  readonly target: ReturnTo;
  readonly grant?: { readonly token: string };
};

export const AUTH_SHEET_CLOSED: AuthSheetSession = { kind: "closed" };

export function canPresentAuthSheet(core: AccessCore): boolean {
  return core.kind === "anonymous" || core.kind === "session_revoked";
}

export function openAuthSheetSession(input: PresentAuthSheetInput): AuthSheetSession {
  return input.grant
    ? { kind: "open", target: input.target, grant: input.grant }
    : { kind: "open", target: input.target };
}
